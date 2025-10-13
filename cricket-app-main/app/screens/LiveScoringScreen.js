import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ref, onValue, update, push, set, get } from "firebase/database";
import { db } from "../config/firebase-config";

export default function LiveScoringScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { matchId } = route.params;

  const [match, setMatch] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bowlerModalVisible, setBowlerModalVisible] = useState(false);
  const [nextBatsmanModalVisible, setNextBatsmanModalVisible] = useState(false);

  const [availableBatsmen, setAvailableBatsmen] = useState([]);
  const [availableBowlers, setAvailableBowlers] = useState([]);
  const [outBatsmanId, setOutBatsmanId] = useState(null);
  const [showInningsSummary, setShowInningsSummary] = useState(false);
  const [inningsSummaryData, setInningsSummaryData] = useState(null);

  const matchRef = useRef(null);

  useEffect(() => {
    if (!matchId) return;
    const mRef = ref(db, `matches/${matchId}`);
    matchRef.current = mRef;

    const unsub = onValue(mRef, (snap) => {
      const data = snap.val();
      setMatch(data || null);
      setLive((data && data.live) || null);
      setLoading(false);
    });

    return () => unsub();
  }, [matchId]);

  const writeLivePatch = async (patch) => {
    try {
      await update(ref(db, `matches/${matchId}/live`), patch);
    } catch (err) {
      console.error("Live update error:", err);
    }
  };

  const ensurePlayerStats = async (playerId) => {
    if (!playerId) return;
    const statRef = ref(db, `matches/${matchId}/live/playerStats/${playerId}`);
    const snap = await get(statRef);
    if (!snap.exists()) {
      await set(statRef, {
        runs: 0,
        balls: 0, 
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        oversBalls: 0,
        runsConceded: 0,
      });
    }
  };

  const incrPlayerStats = async (playerId, patch = {}) => {
    if (!playerId) return;
    await ensurePlayerStats(playerId);
    const statRef = ref(db, `matches/${matchId}/live/playerStats/${playerId}`);
    const snap = await get(statRef);
    const cur = snap.val() || {
      runs: 0,
      balls: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      oversBalls: 0,
      runsConceded: 0,
    };

    const updated = {
      runs: (cur.runs || 0) + (patch.runs || 0),
      balls: (cur.balls || 0) + (patch.balls || 0),
      ballsFaced: (cur.ballsFaced || 0) + (patch.ballsFaced || 0),
      fours: (cur.fours || 0) + (patch.fours || 0),
      sixes: (cur.sixes || 0) + (patch.sixes || 0),
      wickets: (cur.wickets || 0) + (patch.wickets || 0),
      oversBalls: (cur.oversBalls || 0) + (patch.oversBalls || 0),
      runsConceded: (cur.runsConceded || 0) + (patch.runsConceded || 0),
    };

    await set(statRef, updated);
  };

  const pushBall = async (ballObj) => {
    const ballRef = push(ref(db, `matches/${matchId}/live/ballsHistory`));
    await set(ballRef, ballObj);
  };

  const checkInningsEnd = async (newBalls, newWickets, innings, newRuns) => {
    const totalOvers = parseInt(match?.overs || 0, 10);
    const oversCompleted = Math.floor(newBalls / 6) >= totalOvers;
    const wicketsAllOut = newWickets >= 10;

    if (innings === "A") {
      if (oversCompleted || wicketsAllOut) {
        const target = (newRuns || 0) + 1;
        setInningsSummaryData({
          battingTeam: match.teamA,
          bowlingTeam: match.teamB,
          score: `${newRuns}/${newWickets}`,
          overs: Math.floor(newBalls / 6) + "." + (newBalls % 6),
          target,
        });
        setShowInningsSummary(true);
      }
    } else {
      const target = live?.target || 0;
      const scoreB = newRuns || 0;

      if (scoreB >= target) {
        Alert.alert("Match Completed", `${match.teamB} won by ${10 - newWickets} wickets!`);
        await finalizeMatch();
        return;
      }

      if (wicketsAllOut || oversCompleted) {
        const scoreA = live?.scoreA?.runs || 0;
        let winner = "Draw";
        if (scoreA > scoreB) winner = match.teamA;
        else if (scoreB > scoreA) winner = match.teamB;

        Alert.alert("Match Completed", `Winner: ${winner}`);
        await finalizeMatch();
        return;
      }
    }
  };

  const onLegalBall = async (runs = 0) => {
    const curLive = { ...live }; 

    if (!curLive.striker) return Alert.alert("Select Striker first");
    if (!curLive.currentBowler) {
      setAvailableBowlers(
        match.players[curLive.currentInnings === "A" ? "teamB" : "teamA"] || []
      );
      setBowlerModalVisible(true);
      return Alert.alert("Select Bowler first for next over");
    }

    const innings = curLive.currentInnings || "A";
    const scoreKey = innings === "A" ? "scoreA" : "scoreB";
    const curScore = curLive[scoreKey] || { runs: 0, balls: 0, wickets: 0 };

    const newRuns = (curScore.runs || 0) + runs;
    const newBalls = (curScore.balls || 0) + 1;
    const newWickets = curScore.wickets || 0;

    const lastBall = {
      type: "legal",
      runs,
      extra: 0,
      wicketType: null,
      striker: curLive.striker,
      bowler: curLive.currentBowler,
      timestamp: new Date().toISOString(),
    };

    await writeLivePatch({
      [`${scoreKey}/runs`]: newRuns,
      [`${scoreKey}/balls`]: newBalls,
      lastBall,
      currentOverBalls: ((curLive.currentOverBalls || 0) + 1) % 6,
    });

    await pushBall(lastBall);

    await incrPlayerStats(curLive.striker, {
      runs,
      balls: 1,
      ballsFaced: 1,
      fours: runs === 4 ? 1 : 0,
      sixes: runs === 6 ? 1 : 0,
    });

    await incrPlayerStats(curLive.currentBowler, {
      oversBalls: 1,
      runsConceded: runs,
    });

    if (runs % 2 === 1) {
      await writeLivePatch({
        striker: curLive.nonStriker,
        nonStriker: curLive.striker,
      });
    }

    const curOverBalls = ((curLive.currentOverBalls || 0) + 1) % 6;

    if (curOverBalls === 0) {

      await writeLivePatch({ currentBowler: null });
      setAvailableBowlers(
        match.players[innings === "A" ? "teamB" : "teamA"] || []
      );
      setBowlerModalVisible(true);
    }

    await checkInningsEnd(newBalls, newWickets, innings, newRuns);
  };

  const onWicket = async (wicketType = "caught") => {
    const curLive = { ...live };
    if (!curLive || !curLive.striker) return Alert.alert("Select striker first");

    const innings = curLive.currentInnings || "A";
    const scoreKey = innings === "A" ? "scoreA" : "scoreB";
    const curScore = curLive[scoreKey] || { runs: 0, balls: 0, wickets: 0 };

    const newBalls = (curScore.balls || 0) + 1;
    const newWickets = (curScore.wickets || 0) + 1;

    const lastBall = {
      type: "wicket",
      runs: 0,
      extra: 0,
      wicketType,
      striker: curLive.striker,
      bowler: curLive.currentBowler,
      timestamp: new Date().toISOString(),
    };

    await writeLivePatch({
      [`${scoreKey}/balls`]: newBalls,
      [`${scoreKey}/wickets`]: newWickets,
      lastBall,
      currentOverBalls: ((curLive.currentOverBalls || 0) + 1) % 6,
    });
    await pushBall(lastBall);

    
    if (curLive.currentBowler)
      await incrPlayerStats(curLive.currentBowler, { wickets: 1 });


    await incrPlayerStats(curLive.striker, { balls: 1, ballsFaced: 1 });

    setOutBatsmanId(curLive.striker);

    const battingTeamKey = innings === "A" ? "teamA" : "teamB";
    setAvailableBatsmen(
      match.players[battingTeamKey].filter(
        (p) => p.id !== curLive.striker && p.id !== curLive.nonStriker
      )
    );
    setNextBatsmanModalVisible(true);

    await checkInningsEnd(newBalls, newWickets, innings, curScore.runs);
  };


  const onExtra = async (type = "WD", runs = 1) => {
    if (!live || !live.currentBowler) return Alert.alert("Select bowler first");

    const innings = live.currentInnings || "A";
    const scoreKey = innings === "A" ? "scoreA" : "scoreB";
    const curScore = live[scoreKey] || { runs: 0, balls: 0, wickets: 0 };
    const newRuns = (curScore.runs || 0) + runs;

    const lastBall = {
      type: type.toLowerCase(),
      runs,
      extra: 1,
      wicketType: null,
      striker: live.striker,
      bowler: live.currentBowler,
      timestamp: new Date().toISOString(),
    };

    try {
      await writeLivePatch({
        [`${scoreKey}/runs`]: newRuns,
        lastBall,
      });

      await pushBall(lastBall);

      
      await incrPlayerStats(live.currentBowler, {
        runsConceded: runs,
      });


      if (innings === "B") {
        const target = live?.target || 0;
        if (newRuns >= target) {
          Alert.alert("Match Completed", `${match.teamB} won while chasing!`);
          await finalizeMatch();
          return;
        }
      }
    } catch (err) {
      console.error("onExtra error", err);
    }
  };

  const handleSelectNextBatsman = async (player) => {
    setNextBatsmanModalVisible(false);
    if (!player) return;

    const updates = { striker: player.id };
    const curLive = live || {};
    if (!curLive.nonStriker) {
    
      const battingTeamKey = curLive.currentInnings === "A" ? "teamA" : "teamB";
      const nextNonStriker = match.players[battingTeamKey].find(
        (p) => p.id !== player.id
      );
      if (nextNonStriker) updates.nonStriker = nextNonStriker.id;
    }

    await writeLivePatch(updates);
    await ensurePlayerStats(player.id);
    Alert.alert("Batsman Added", `${player.name} is now batting.`);
  };

  const handleSelectBowler = async (player) => {
    setBowlerModalVisible(false);
    if (!player) return;


    const curLiveSnap = await get(ref(db, `matches/${matchId}/live`));
    const curLive = curLiveSnap.val() || {};

  
    const isNewOver = !curLive.currentBowler;

    const updates = { currentBowler: player.id };
    if (isNewOver) {
      updates.currentOverBalls = 0; 
    }

    await writeLivePatch(updates);
    await ensurePlayerStats(player.id);

    Alert.alert("Bowler Selected", `${player.name} will bowl next.`);
  };

  const handleStartSecondInnings = async () => {
    if (!inningsSummaryData) return;

    const target = inningsSummaryData.target;
    const teamBPlayers = match.players.teamB || [];

    await writeLivePatch({
      currentInnings: "B",
      target,
      currentOverBalls: 0,
      striker: teamBPlayers[0]?.id || null,
      nonStriker: teamBPlayers[1]?.id || null,
      currentBowler: null,
      scoreB: { runs: 0, balls: 0, wickets: 0 },
    });

    setShowInningsSummary(false);
    Alert.alert("2nd Innings Started", `${match.teamB} chasing ${target}`);
  };

 const finalizeMatch = async () => {
  try {
    const scoreA = live?.scoreA || { runs: 0, wickets: 0, balls: 0 };
    const scoreB = live?.scoreB || { runs: 0, wickets: 0, balls: 0 };

    let winner = "Draw";
    if (scoreA.runs > scoreB.runs)
      winner = match.teamA?.teamName || match.teamA;
    else if (scoreB.runs > scoreA.runs)
      winner = match.teamB?.teamName || match.teamB;

    const matchPath = match.tournamentId
      ? `tournaments/${match.tournamentId}/matches/${matchId}`
      : `matches/${matchId}`;

    const updates = {
      status: "completed",
      winner,
      teamA: {
        ...(match.teamA?.teamName ? match.teamA : { teamName: match.teamA }),
        ...scoreA,
      },
      teamB: {
        ...(match.teamB?.teamName ? match.teamB : { teamName: match.teamB }),
        ...scoreB,
      },
      live: null,
      completedAt: new Date().toISOString(),
    };

    await update(ref(db, matchPath), updates);

    await update(ref(db, `matches/${matchId}`), updates);

    await update(ref(db, `liveMatches/${matchId}`), {
      status: "completed",
      winner,
      completedAt: new Date().toISOString(),
      teamA: updates.teamA,
      teamB: updates.teamB,
    });

    if (match.tournamentId) {
      await update(ref(db, `tournaments/${match.tournamentId}/matches/${matchId}`), updates);
    }

    if (match.tournamentId) {
      await update(ref(db, `tournaments/${match.tournamentId}/matches/${matchId}/live`), {
        scoreA,
        scoreB,
        status: "completed",
      });
    }

    Alert.alert("Match Completed!", `Winner: ${winner}`);
    // navigation.replace("MatchSummaryScreen", {
    //   matchId,
    //   winner,
    //   teamA: updates.teamA,
    //   teamB: updates.teamB,
    // });

  } catch (err) {
    console.error("❌ Finalize Match Error:", err);
    Alert.alert("Error", err.message);
  }
};


  if (loading || !match || !live) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b22222" />
        <Text style={{ marginTop: 8 }}>Loading match...</Text>
      </View>
    );
  }
  const isBowlerSelected = !!live.currentBowler;

  const innings = live.currentInnings || "A";
  const inningsScore = innings === "A" ? live?.scoreA : live?.scoreB || { runs: 0, balls: 0, wickets: 0 };
  const totalOvers = parseInt(match.overs || 0, 10);
  const oversDone = Math.floor((inningsScore.balls || 0) / 6);
  const ballsInOver = (inningsScore.balls || 0) % 6;
  const oversDisplay = `${oversDone}.${ballsInOver}`;
  const target = live?.target || null;
  const lastBalls = live.ballsHistory ? Object.values(live.ballsHistory).slice(-50) : [];

  const findPlayerName = (inningsSide, playerId) => {
    if (!playerId) return "-";
    const teamPlayers = match.players[inningsSide === "A" ? "teamA" : "teamB"] || [];
    const p = teamPlayers.find((x) => x.id === playerId);
    return p ? p.name : playerId;
  };

  const getPlayerStat = (playerId) => {
    if (!live || !live.playerStats) return null;
    return live.playerStats[playerId] || null;
  };

  const battingTeamKey = innings === "A" ? "teamA" : "teamB";
  const battingPlayers = match.players?.[battingTeamKey] || [];
  const bowlingTeamKey = innings === "A" ? "teamB" : "teamA";
  const bowlingPlayers = match.players?.[bowlingTeamKey] || [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{match.teamA} vs {match.teamB}</Text>

      <View style={styles.scoreBox}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Innings: {innings === "A" ? match.teamA : match.teamB}</Text>
        <Text style={styles.scoreLarge}>{inningsScore.runs}/{inningsScore.wickets} ({oversDisplay} / {totalOvers} ov)</Text>

        {innings === "B" && target && (
          <Text style={{ color: "#e74c3c", fontWeight: "700", marginTop: 6 }}>
            Target: {target} | {Math.max(0, target - inningsScore.runs)} needed in {Math.max(0, totalOvers*6 - inningsScore.balls)} balls
          </Text>
        )}

        <Text style={{ color: "#666", marginTop: 6 }}>
          Striker: {findPlayerName(innings, live.striker)} {"\n"}
          Non-Striker: {findPlayerName(innings, live.nonStriker)} {"\n"}
          Bowler: {findPlayerName(innings === "A" ? "B" : "A", live.currentBowler)}
        </Text>
      </View>

      <Text style={{ fontWeight: "700", marginTop: 12 }}>Runs</Text>
      <View style={styles.buttonsRow}>
        {[0, 1, 2, 3, 4, 6].map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.runBtn,
              !isBowlerSelected && { backgroundColor: "#ccc" },
            ]}
            onPress={() => {
              if (isBowlerSelected) onLegalBall(r);
              else Alert.alert("Select Bowler", "Please select the next bowler before continuing.");
            }}
            disabled={!isBowlerSelected}
          >
            <Text style={styles.runText}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
        <TouchableOpacity
          style={[styles.extraBtn, !isBowlerSelected && { backgroundColor: "#ccc" }]}
          onPress={() => {
            if (isBowlerSelected) onWicket("caught");
            else Alert.alert("Select Bowler", "Please select the next bowler first.");
          }}
          disabled={!isBowlerSelected}
        >
          <Text style={styles.extraText}>W</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, !isBowlerSelected && { backgroundColor: "#ccc" }]}
          onPress={() => {
            if (isBowlerSelected) onExtra("WD", 1);
            else Alert.alert("Select Bowler", "Please select the next bowler first.");
          }}
          disabled={!isBowlerSelected}
        >
          <Text style={styles.extraText}>WD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, !isBowlerSelected && { backgroundColor: "#ccc" }]}
          onPress={() => {
            if (isBowlerSelected) onExtra("NB", 1);
            else Alert.alert("Select Bowler", "Please select the next bowler first.");
          }}
          disabled={!isBowlerSelected}
        >
          <Text style={styles.extraText}>NB</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: "#f39c12" }]}
          onPress={() => {
            Alert.alert("End Match", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              { text: "End", style: "destructive", onPress: finalizeMatch },
            ]);
          }}
        >
          <Text style={styles.extraText}>End</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.bowlerBtn} onPress={() => {
        setAvailableBowlers(match.players[innings === "A" ? "teamB" : "teamA"] || []);
        setBowlerModalVisible(true);
      }}>
        <Text style={styles.bowlerText}>Select Bowler</Text>
      </TouchableOpacity>

      {/* Last Balls */}
      <Text style={{ fontWeight: "700", marginTop: 16 }}>Last Balls</Text>
      <ScrollView horizontal style={{ marginTop: 6 }}>
        {lastBalls.map((b, i) => (
          <View key={i} style={{ padding: 8, backgroundColor: "#eee", borderRadius: 6, marginRight: 4 }}>
            <Text>{b.runs}{b.type === "wicket" ? "W" : ""}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={{ fontWeight: "700", marginTop: 16 }}>Batting - {innings === "A" ? match.teamA : match.teamB}</Text>
      <View style={{ marginTop: 8, borderRadius: 8, backgroundColor: "#fafafa", padding: 8 }}>
        <FlatList
          data={battingPlayers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const s = getPlayerStat(item.id) || {};
            return (
              <View style={styles.playerStatRow}>
                <View>
                  <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                  <Text style={{ color: "#555", fontSize: 12 }}>{s.team || ""}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontWeight: "700" }}>{(s.runs || 0)}/{(s.wickets || 0)}</Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>{(s.ballsFaced || 0)} balls</Text>
                </View>
                <View style={{ marginLeft: 12, alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 12 }}>4s: {(s.fours || 0)}</Text>
                  <Text style={{ fontSize: 12 }}>6s: {(s.sixes || 0)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={{ color: "#777", textAlign: "center" }}>No players.</Text>}
        />
      </View>

      <Text style={{ fontWeight: "700", marginTop: 12 }}>Bowling - {innings === "A" ? match.teamB : match.teamA}</Text>
      <View style={{ marginTop: 8, borderRadius: 8, backgroundColor: "#fafafa", padding: 8 }}>
        <FlatList
          data={bowlingPlayers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const s = getPlayerStat(item.id) || {};
            const oversBowled = s.oversBalls ? `${Math.floor(s.oversBalls / 6)}.${s.oversBalls % 6}` : "0.0";
            return (
              <View style={styles.playerStatRow}>
                <View>
                  <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontWeight: "700" }}>{s.wickets || 0} wkts</Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>{oversBowled} overs</Text>
                </View>
                <View style={{ marginLeft: 12, alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 12 }}>Runs: {(s.runsConceded || 0)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={{ color: "#777", textAlign: "center" }}>No players.</Text>}
        />
      </View>

      <Modal visible={bowlerModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: "700", marginBottom: 12 }}>Select Bowler</Text>
            <FlatList
              data={availableBowlers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectBowler(item)}>
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[styles.modalItem, { backgroundColor: "#ccc" }]} onPress={() => setBowlerModalVisible(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={nextBatsmanModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: "700", marginBottom: 12 }}>Select Next Batsman</Text>
            <FlatList
              data={availableBatsmen}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectNextBatsman(item)}>
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[styles.modalItem, { backgroundColor: "#ccc" }]} onPress={() => setNextBatsmanModalVisible(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showInningsSummary} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Innings Summary</Text>
            {inningsSummaryData && (
              <>
                <Text>{inningsSummaryData.battingTeam}: {inningsSummaryData.score} ({inningsSummaryData.overs} overs)</Text>
                <Text>Target for next team: {inningsSummaryData.target}</Text>
              </>
            )}
            <TouchableOpacity style={[styles.modalItem, { marginTop: 12 }]} onPress={handleStartSecondInnings}>
              <Text style={{ fontWeight: "700" }}>Start 2nd Innings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12, color: "#b22222" },
  scoreBox: { padding: 12, borderRadius: 8, backgroundColor: "#f5f5f5" },
  scoreLarge: { fontSize: 24, fontWeight: "800", marginTop: 8 },
  buttonsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  runBtn: { padding: 12, backgroundColor: "#2ecc71", borderRadius: 6, margin: 4 },
  runText: { color: "#fff", fontWeight: "700" },
  extraBtn: { padding: 12, backgroundColor: "#e74c3c", borderRadius: 6 },
  extraText: { color: "#fff", fontWeight: "700" },
  bowlerBtn: { marginTop: 12, padding: 12, backgroundColor: "#3498db", borderRadius: 6, alignItems: "center" },
  bowlerText: { color: "#fff", fontWeight: "700" },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "80%", backgroundColor: "#fff", borderRadius: 8, padding: 16, maxHeight: "80%" },
  modalItem: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
  playerStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
