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
  const [outBatsmanId, setOutBatsmanId] = useState(null);

  const matchRef = useRef(null);

 
  useEffect(() => {
    let unsub = null;

    const fetchMatch = async () => {
      try {
        if (!matchId) {
          Alert.alert("Error", "No match ID provided!");
          setLoading(false);
          return;
        }

        const mRef = ref(db, `matches/${matchId}`);
        matchRef.current = mRef;

        unsub = onValue(mRef, (snap) => {
          const data = snap.val() || {};
          const teamA = Array.isArray(data.players?.teamA) ? data.players.teamA : [];
          const teamB = Array.isArray(data.players?.teamB) ? data.players.teamB : [];

          const innings = data.live?.currentInnings || "A";
          const battingTeam = innings === "A" ? teamA : teamB;

          const strikerId = data.live?.striker || (battingTeam[0]?.id || null);
          const nonStrikerId = data.live?.nonStriker || (battingTeam[1]?.id || null);

          const liveData = {
            currentInnings: innings,
            currentOverBalls: data.live?.currentOverBalls || 0,
            striker: strikerId,
            nonStriker: nonStrikerId,
            currentBowler: data.live?.currentBowler || null,
            ballsHistory: data.live?.ballsHistory || {},
            playerStats: data.live?.playerStats || {},
            scoreA: data.live?.scoreA || { runs: 0, balls: 0, wickets: 0 },
            scoreB: data.live?.scoreB || { runs: 0, balls: 0, wickets: 0 },
            target: data.live?.target || 0,
          };

          setMatch({ ...data, players: { teamA, teamB } });
          setLive(liveData);
          setLoading(false);

          if (!data.live) set(ref(db, `matches/${matchId}/live`), liveData);
        });
      } catch (err) {
        console.error("Error fetching live match:", err);
        setLoading(false);
      }
    };

    fetchMatch();
    return () => unsub && unsub();
  }, [matchId]);

  const writeLivePatch = async (patch) => {
    await update(ref(db, `matches/${matchId}/live`), patch).catch(console.error);
  };
  const markMatchCompleted = async (winnerTeam) => {
  try {
    const matchRef = ref(db, `matches/${matchId}`);
    await update(matchRef, {
      status: "completed",       
      "live/status": "completed", 
      "live/winner": winnerTeam,  
      completed: true,            
    });
  } catch (err) {
    console.error("Error updating match status:", err);
  }
};


  const ensurePlayerStats = async (playerId) => {
    if (!playerId || !match || !live) return;

    if (!live.playerStats) {
      await writeLivePatch({ playerStats: {} });
    }

    const statRef = ref(db, `matches/${matchId}/live/playerStats/${playerId}`);
    const snap = await get(statRef);
    if (snap.exists()) return;

    const player =
      match.players.teamA.find((x) => x.id === playerId) ||
      match.players.teamB.find((x) => x.id === playerId);
    const name = player?.name || "NA";
    const team = match.players.teamA.includes(player)
      ? match.teamA?.teamName || "Team A"
      : match.teamB?.teamName || "Team B";

    await set(statRef, {
      playerId,
      name,
      team,
      runs: 0,
      balls: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      oversBalls: 0,
      runsConceded: 0,
      isOut: false,
      matchesPlayed: 1,
    });
  };

  const updatePlayerStats = async (playerId, patch = {}) => {
    await ensurePlayerStats(playerId);
    const statRef = ref(db, `matches/${matchId}/live/playerStats/${playerId}`);
    const snap = await get(statRef);
    const cur = snap.val() || {};
    await update(statRef, { ...cur, ...patch });
  };

  const pushBall = async (ballObj) => {
    const ballRef = push(ref(db, `matches/${matchId}/live/ballsHistory`));
    await set(ballRef, ballObj);
  };

 
  const handleRun = async (runs, isExtra = false) => {
    if (!live || !match) return;

    const strikerId = live.striker;
    const bowlerId = live.currentBowler;
    const nonStrikerId = live.nonStriker;

    if (!strikerId || !bowlerId) {
      Alert.alert("Selection Missing", "Select striker and bowler first!");
      return;
    }

    const innings = live.currentInnings;
    const scoreKey = innings === "A" ? "scoreA" : "scoreB";
    const curScore = live[scoreKey] || { runs: 0, balls: 0, wickets: 0 };

    const newScore = {
      ...curScore,
      runs: (curScore.runs || 0) + runs,
      balls: isExtra ? curScore.balls : (curScore.balls || 0) + 1,
    };

    const newOverBalls = isExtra ? live.currentOverBalls : (live.currentOverBalls || 0) + 1;

    await writeLivePatch({ [scoreKey]: newScore, currentOverBalls: newOverBalls });

 
    await updatePlayerStats(strikerId, {
      runs: (live.playerStats?.[strikerId]?.runs || 0) + runs,
      ballsFaced: isExtra
        ? live.playerStats?.[strikerId]?.ballsFaced
        : (live.playerStats?.[strikerId]?.ballsFaced || 0) + 1,
    });

    await updatePlayerStats(bowlerId, {
      oversBalls: isExtra
        ? live.playerStats?.[bowlerId]?.oversBalls || 0
        : (live.playerStats?.[bowlerId]?.oversBalls || 0) + 1,
      runsConceded: (live.playerStats?.[bowlerId]?.runsConceded || 0) + runs,
    });

    await pushBall({ runs, bowler: bowlerId, batsman: strikerId, type: isExtra ? "extra" : "run" });


    if (!isExtra && runs % 2 === 1 && nonStrikerId) {
      await writeLivePatch({ striker: nonStrikerId, nonStriker: strikerId });
    }

    const ballsLimit = (match.overs || 0) * 6;
    const wicketsLimit = 10;

    if (innings === "A" && (newScore.balls >= ballsLimit || newScore.wickets >= wicketsLimit)) {
      const battingTeam = match.players.teamB;
      const newStriker = battingTeam[0]?.id || null;
      const newNonStriker = battingTeam[1]?.id || null;

      const patch = {
        currentInnings: "B",
        currentOverBalls: 0,
        striker: newStriker,
        nonStriker: newNonStriker,
        target: newScore.runs + 1,
        scoreB: { runs: 0, balls: 0, wickets: 0 },
        ballsHistory: {},
      };

      await writeLivePatch(patch);
      setLive((prev) => ({ ...(prev || {}), ...patch }));

      Alert.alert("Innings Over", `Second innings target: ${newScore.runs + 1}`);
      return;
    }

   
if (innings === "B") {
  const target = live.target || 0;
  const ballsLimit = (match.overs || 0) * 6;
  const wicketsLimit = 10;

 
  if (newScore.runs >= target) {
     const winnerTeam = match.teamB?.teamName || "Team B";
     await markMatchCompleted(winnerTeam);
    Alert.alert("Match Over", `${match.teamB?.teamName || "Team B"} wins!`);
    navigation.navigate("Home");
    return;
  }


  if (newScore.balls >= ballsLimit || newScore.wickets >= wicketsLimit) {
    const winnerTeam =
      newScore.runs >= target ? match.teamB?.teamName : match.teamA?.teamName;
     await markMatchCompleted(winnerTeam);
    Alert.alert("Match Over", `${winnerTeam} wins!`);
    navigation.navigate("HomeScreen");
    return;
  }
}

  };

 
  const handleWicket = async () => {
    if (!live || !match) return;

    const strikerId = live.striker;
    const bowlerId = live.currentBowler;

    if (!strikerId || !bowlerId) {
      Alert.alert("Selection Missing", "Select striker and bowler first!");
      return;
    }

    const innings = live.currentInnings;
    const scoreKey = innings === "A" ? "scoreA" : "scoreB";
    const curScore = live[scoreKey] || { runs: 0, balls: 0, wickets: 0 };

    const newScore = { ...curScore, wickets: (curScore.wickets || 0) + 1, balls: (curScore.balls || 0) + 1 };
    await writeLivePatch({ [scoreKey]: newScore, currentOverBalls: (live.currentOverBalls || 0) + 1 });

    await updatePlayerStats(strikerId, { isOut: true });
    await updatePlayerStats(bowlerId, {
      wickets: (live.playerStats?.[bowlerId]?.wickets || 0) + 1,
      oversBalls: (live.playerStats?.[bowlerId]?.oversBalls || 0) + 1,
    });

    await pushBall({ runs: 0, bowler: bowlerId, batsman: strikerId, type: "wicket" });

    const teamKey = innings === "A" ? "teamA" : "teamB";
    const available = (match.players[teamKey] || []).filter(
      (p) => !live.playerStats?.[p.id]?.isOut && p.id !== live.nonStriker
    );

   if (available.length === 0) {
  if (innings === "A") {

    const battingTeam = match.players.teamB;
    const patch = {
      currentInnings: "B",
      currentOverBalls: 0,
      striker: battingTeam[0]?.id || null,
      nonStriker: battingTeam[1]?.id || null,
      target: newScore.runs + 1,
      scoreB: { runs: 0, balls: 0, wickets: 0 },
      ballsHistory: {},
    };
    await writeLivePatch(patch);
    setLive((prev) => ({ ...(prev || {}), ...patch }));
    Alert.alert("All Out", `Second innings target: ${newScore.runs + 1}`);
  } else {
  
    const winnerTeam =
      newScore.runs >= (live.target || 0) ? match.teamB?.teamName : match.teamA?.teamName;
   await markMatchCompleted(winnerTeam);

    Alert.alert("All Out", `${winnerTeam} wins!`);
    navigation.navigate("HomeScreen");
  }
  return;
}


    setAvailableBatsmen(available);
    setOutBatsmanId(strikerId);
    setNextBatsmanModalVisible(true);
  };

  const handleSelectBowler = async (playerId) => {
    setBowlerModalVisible(false);
    if (!playerId || !live) return;

    if (!live.playerStats) {
      await writeLivePatch({ playerStats: {} });
    }

    const updates = { currentBowler: playerId };
    if (!live.currentBowler) updates.currentOverBalls = 0;

    await writeLivePatch(updates);
    await ensurePlayerStats(playerId);
  };

  const last6Balls = () => {
    if (!live || !live.ballsHistory) return [];
    return Object.values(live.ballsHistory || {}).slice(-6).reverse();
  };

  const renderPlayer = (player, teamKey) => {
    const stats = live?.playerStats?.[player.id] || {};
    const isStriker = player.id === live?.striker;
    const isNonStriker = player.id === live?.nonStriker;
    const isBowler = player.id === live?.currentBowler;

    return (
      <View
        key={player.id}
        style={[
          styles.playerRow,
          isStriker || isNonStriker ? { backgroundColor: "#dff0d8" } : {},
          isBowler ? { backgroundColor: "#f2dede" } : {},
        ]}
      >
        <Text style={{ flex: 1 }}>{player?.name || "NA"}</Text>

        
        {teamKey === (live?.currentInnings === "A" ? "teamA" : "teamB") && (
          <Text>
            R:{stats?.runs || 0} B:{stats?.ballsFaced || 0} {stats?.isOut ? "OUT" : ""}
          </Text>
        )}

        
        {teamKey !== (live?.currentInnings === "A" ? "teamA" : "teamB") && stats?.oversBalls !== undefined && (
          <Text>
            O:{Math.floor(stats.oversBalls / 6)}.{stats.oversBalls % 6} R:{stats.runsConceded || 0} W:{stats.wickets || 0}
          </Text>
        )}
      </View>
    );
  };

  const findPlayerName = (teamKey, playerId) => {
    if (!playerId) return "NA";
    const team = match?.players?.[teamKey] || [];
    const p = team.find((x) => x.id === playerId);
    return p ? p.name : "NA";
  };

  if (loading || !match || !live) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b22222" />
        <Text style={{ marginTop: 8 }}>Loading match...</Text>
      </View>
    );
  }

  const innings = live.currentInnings;
  const score = innings === "A" ? live.scoreA : live.scoreB;
  const overs = `${Math.floor(score.balls / 6)}.${score.balls % 6}`;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.scoreBox}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>
          {innings === "A" ? match.teamA?.teamName : match.teamB?.teamName} Innings
        </Text>

        {innings === "B" && live.target > 0 && (
          <Text style={{ fontWeight: "700", color: "#e74c3c", marginBottom: 6 }}>
            Target: {live.target} runs
          </Text>
        )}

        <Text style={styles.scoreLarge}>
          {score.runs}/{score.wickets} ({Math.floor(score.balls / 6)}.{score.balls % 6}/{match.overs})
        </Text>

        <View style={{ marginTop: 8 }}>
          <Text>Striker: {findPlayerName(innings === "A" ? "teamA" : "teamB", live.striker)}</Text>
          <Text>Non-Striker: {findPlayerName(innings === "A" ? "teamA" : "teamB", live.nonStriker)}</Text>
          <Text>Bowler: {findPlayerName(innings === "A" ? "teamB" : "teamA", live.currentBowler)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", marginTop: 12 }}>
        {last6Balls().map((ball, idx) => (
          <View
            key={idx}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginRight: 6,
              backgroundColor:
                ball.type === "wicket" ? "#e74c3c" : ball.type === "extra" ? "#f1c40f" : "#2ecc71",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>{ball.runs ?? "NA"}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.extraBtn} onPress={() => setBowlerModalVisible(true)}>
        <Text style={styles.extraText}>Select Bowler</Text>
      </TouchableOpacity>

      <View style={styles.buttonsRow}>
        {[0, 1, 2, 3, 4, 6].map((r) => (
          <TouchableOpacity key={r} style={styles.runBtn} onPress={() => handleRun(r)}>
            <Text style={styles.runText}>{r}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.extraBtn} onPress={() => handleRun(1, true)}>
          <Text style={styles.extraText}>+1 Extra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.extraBtn} onPress={handleWicket}>
          <Text style={styles.extraText}>Wicket</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontWeight: "700", marginTop: 16 }}>Team A Players</Text>
      {(match.players.teamA || []).map((p) => renderPlayer(p, "teamA"))}

      <Text style={{ fontWeight: "700", marginTop: 16 }}>Team B Players</Text>
      {(match.players.teamB || []).map((p) => renderPlayer(p, "teamB"))}

      <Modal visible={nextBatsmanModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Select Next Batsman</Text>
            <FlatList
              data={availableBatsmen || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={async () => {
                    const newStriker = item.id;
                    const nonStriker =
                      live.nonStriker && live.nonStriker !== outBatsmanId
                        ? live.nonStriker
                        : live.striker || availableBatsmen.find((b) => b.id !== newStriker)?.id;

                    await writeLivePatch({ striker: newStriker, nonStriker });
                    setNextBatsmanModalVisible(false);
                  }}
                >
                  <Text>{item.name || "NA"}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={bowlerModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Select Bowler</Text>
            <FlatList
              data={innings === "A" ? match.players.teamB || [] : match.players.teamA || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectBowler(item.id)}>
                  <Text>{item.name || "NA"}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scoreBox: { padding: 12, borderRadius: 8, backgroundColor: "#f5f5f5", marginBottom: 12 },
  scoreLarge: { fontSize: 28, fontWeight: "800", marginTop: 4, color: "#2c3e50" },
  buttonsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  runBtn: { padding: 12, backgroundColor: "#2ecc71", borderRadius: 6, margin: 4 },
  runText: { color: "#fff", fontWeight: "700" },
  extraBtn: { padding: 12, backgroundColor: "#e74c3c", borderRadius: 6, margin: 4 },
  extraText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "80%", backgroundColor: "#fff", borderRadius: 8, padding: 16, maxHeight: "80%" },
  modalItem: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
  playerRow: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderColor: "#eee", alignItems: "center" },
});
