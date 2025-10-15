import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../config/firebase-config";
import { ref, onValue, get, update, set, push } from "firebase/database";


const getGroupWinnersInfo = (allMatches) => {
  return Object.values(allMatches)
    .filter((m) => m.stage === "Group" && m.status === "completed" && m.winner)
    .map((m) => {
      let winnerName = null;
      if (m.teamA?.name === m.winner) winnerName = m.teamA.name;
      else if (m.teamB?.name === m.winner) winnerName = m.teamB.name;

      return {
        winner: winnerName || m.winner,
        overs: m.overs || 20,
        venue: m.venue || "TBD",
      };
    });
};


const setupKnockoutMatches = async (tournamentId) => {
  const matchesSnap = await get(ref(db, "matches"));
  if (!matchesSnap.exists()) return;

  const allMatches = matchesSnap.val();
  const winnersInfo = getGroupWinnersInfo(allMatches);
  if (winnersInfo.length < 2) return;

  const quarterFinals = [];
  for (let i = 0; i < winnersInfo.length; i += 2) {
    const team1 = winnersInfo[i]?.winner;
    const team2 = winnersInfo[i + 1]?.winner;

    if (team1 && team2) {
      quarterFinals.push({
        teamA: team1,
        teamB: team2,
        overs: winnersInfo[i].overs,
        venue: winnersInfo[i].venue,
      });
    }
  }

  for (const qf of quarterFinals) {
    const newRef = push(ref(db, "matches"));
    await set(newRef, {
      tournamentId,
      stage: "Quarter Final",
      teamA: { teamName: qf.teamA },
      teamB: { teamName: qf.teamB },
      overs: qf.overs,
      venue: qf.venue,
      status: "upcoming",
      createdAt: new Date().toISOString(),
    });
  }

  console.log("✅ Knockout matches created with proper team names!");
};

const generatePointsTable = async (tournamentId) => {
  try {
    const matchesRef = ref(db, "matches");
    const matchesSnapshot = await get(matchesRef);
    if (!matchesSnapshot.exists()) return;

    const allMatches = matchesSnapshot.val();

    // Only completed matches for this tournament
    const tournamentMatches = Object.values(allMatches).filter(
      (m) => m.tournamentId === tournamentId && m.status === "completed"
    );

    if (tournamentMatches.length === 0) return;

    const pointsTable = {};

    // Convert balls to overs
    const ballsToOvers = (balls) => (balls ? balls / 6 : 0);

    tournamentMatches.forEach((match) => {
      const teamA = match.teamA?.teamName || match.teamA?.name;
      const teamB = match.teamB?.teamName || match.teamB?.name;
      const winner = match.winner;

      if (!teamA || !teamB) return;

      const scoreA = match.live?.scoreA || match.scoreA || { runs: 0, balls: 0 };
      const scoreB = match.live?.scoreB || match.scoreB || { runs: 0, balls: 0 };

      const initTeam = (teamName) => {
        if (!pointsTable[teamName]) {
          pointsTable[teamName] = {
            teamName,
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            points: 0,
            runsScored: 0,
            oversFaced: 0,
            runsConceded: 0,
            oversBowled: 0,
            nrr: 0,
          };
        }
      };

      initTeam(teamA);
      initTeam(teamB);

      pointsTable[teamA].runsScored += scoreA.runs;
      pointsTable[teamA].oversFaced += ballsToOvers(scoreA.balls);
      pointsTable[teamA].runsConceded += scoreB.runs;
      pointsTable[teamA].oversBowled += ballsToOvers(scoreB.balls);

      pointsTable[teamB].runsScored += scoreB.runs;
      pointsTable[teamB].oversFaced += ballsToOvers(scoreB.balls);
      pointsTable[teamB].runsConceded += scoreA.runs;
      pointsTable[teamB].oversBowled += ballsToOvers(scoreA.balls);

      pointsTable[teamA].played += 1;
      pointsTable[teamB].played += 1;

      if (winner === teamA) {
        pointsTable[teamA].won += 1;
        pointsTable[teamA].points += 2;
        pointsTable[teamB].lost += 1;
      } else if (winner === teamB) {
        pointsTable[teamB].won += 1;
        pointsTable[teamB].points += 2;
        pointsTable[teamA].lost += 1;
      } else {
        pointsTable[teamA].tied += 1;
        pointsTable[teamB].tied += 1;
        pointsTable[teamA].points += 1;
        pointsTable[teamB].points += 1;
      }
    });

    // Calculate NRR
    Object.values(pointsTable).forEach((team) => {
      const runRateFor = team.oversFaced > 0 ? team.runsScored / team.oversFaced : 0;
      const runRateAgainst = team.oversBowled > 0 ? team.runsConceded / team.oversBowled : 0;
      team.nrr = parseFloat((runRateFor - runRateAgainst).toFixed(3));
    });

    // Sort by points then NRR
    const sortedPoints = Object.fromEntries(
      Object.entries(pointsTable).sort(([, a], [, b]) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.nrr - a.nrr;
      })
    );

    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    await update(tournamentRef, { pointsTable: sortedPoints });

    console.log("✅ Points table generated and sorted successfully!");
  } catch (err) {
    console.error("Error generating points table:", err);
  }
};



const calculatePlayerStats = async (tournamentId, setPlayerStats, setPlayerMatchStats) => {
  try {
    const matchesRef = ref(db, "matches");
    const snapshot = await get(matchesRef);
    if (!snapshot.exists()) return;

    const allMatches = snapshot.val();
    const tournamentMatches = Object.entries(allMatches)
      .filter(([id, m]) => m.tournamentId === tournamentId && m.playerStats)
      .map(([id, m]) => ({ id, ...m }));

    const stats = {}; 
    const matchStats = {}; 

    tournamentMatches.forEach((match) => {
      const playerStatsData = match.playerStats || {};
      Object.entries(playerStatsData).forEach(([playerId, s]) => {
       
        if (!stats[playerId]) stats[playerId] = { name: s.name, team: s.team, runs: 0, wickets: 0, fours: 0, sixes: 0 };
        stats[playerId].runs += s.runs || 0;
        stats[playerId].wickets += s.wickets || 0;
        stats[playerId].fours += s.fours || 0;
        stats[playerId].sixes += s.sixes || 0;

    
        if (!matchStats[playerId]) matchStats[playerId] = [];
        matchStats[playerId].push({
          matchId: match.id,
          runs: s.runs || 0,
          wickets: s.wickets || 0,
          fours: s.fours || 0,
          sixes: s.sixes || 0,
          team: s.team,
        });
      });
    });

    const players = Object.values(stats);

    const topRuns = [...players].sort((a, b) => b.runs - a.runs).slice(0, 10);
    const topWickets = [...players].sort((a, b) => b.wickets - a.wickets).slice(0, 10);
    const topFours = [...players].sort((a, b) => b.fours - a.fours).slice(0, 10);
    const topSixes = [...players].sort((a, b) => b.sixes - a.sixes).slice(0, 10);

    setPlayerStats({ topRuns, topWickets, topFours, topSixes });
    setPlayerMatchStats(matchStats);
  } catch (error) {
    console.error("Error calculating player stats:", error);
  }
};

const createPointsTable = async (id) => {
  await generatePointsTable(id);
  const snapshot = await get(ref(db, `tournaments/${id}`));
  if(snapshot.exists()) setTournament(snapshot.val());
};


const TournamentDetails = ({ route }) => {
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState("Matches");
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [matches, setMatches] = useState([]);
  const [playerMatchStats, setPlayerMatchStats] = useState({});

  const [playerStats, setPlayerStats] = useState({
    topRuns: [],
    topWickets: [],
    topFours: [],
    topSixes: [],
  });

  const navigation = useNavigation();

  useEffect(() => {
    if (!tournamentId) return;
    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const matchesRef = ref(db, `matches`);

    const unsubscribeTournament = onValue(tournamentRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTournament(data);

        const currentEmail = auth.currentUser?.email?.toLowerCase();
        const organiserEmail = data.organiserEmail?.toLowerCase();
        setIsOrganizer(currentEmail === organiserEmail);

        const teamList = data.teams
          ? Object.entries(data.teams).map(([id, t]) => ({
              id,
              teamName: t.teamName || "Unnamed Team",
              captainName: t.captainName || "Unknown",
              captainNumber: t.captainNumber || "-",
              city: t.city || "-",
              logo: t.logo || null,
            }))
          : [];
        setTeams(teamList);
      }
    });

    const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allMatches = snapshot.val();
        const tournamentMatches = Object.entries(allMatches)
          .filter(([id, m]) => m.tournamentId === tournamentId)
          .map(([id, m]) => ({
            id,
            ...m,
            teamA: typeof m.teamA === "string" ? { teamName: m.teamA } : m.teamA || { teamName: null },
            teamB: typeof m.teamB === "string" ? { teamName: m.teamB } : m.teamB || { teamName: null },
            scoreA: m.scoreA || { runs: 0, wickets: 0, balls: 0 },
            scoreB: m.scoreB || { runs: 0, wickets: 0, balls: 0 },
            overs: m.overs || 0,
            status: m.status || "upcoming",
            winner: m.winner || null,
          }));

        setMatches(tournamentMatches);

        
        calculatePlayerStats(tournamentId, setPlayerStats, setPlayerMatchStats);

      } else {
        setMatches([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeTournament();
      unsubscribeMatches();
    };
  }, [tournamentId]);
  const inviteCaptains = () => {
    const message = `🏏 Join the tournament "${tournament.name}"!\nRegister your team now.`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url)
      .then((supported) =>
        supported ? Linking.openURL(url) : alert("⚠️ WhatsApp not installed")
      )
      .catch(console.error);
  };

  if (loading)
    return <ActivityIndicator size="large" style={{ flex: 1, marginTop: 50 }} />;

  if (!tournament)
    return <Text style={{ textAlign: "center", marginTop: 50 }}>Tournament not found!</Text>;

 
  const tabs = ["Matches", "Teams", "Points Table", "Stats"];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.cardContainer}>
        <Image
          source={tournament.logo ? { uri: tournament.logo } : require("../assets/t1.jpg")}
          style={styles.tournamentLogo}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{tournament.name || "Unnamed Tournament"}</Text>
          <Text style={styles.dates}>
            {tournament.startDate || "N/A"} - {tournament.endDate || "TBD"}
          </Text>
        </View>
      </View>

     
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1, width: "100%" }}>
        {activeTab === "Matches" && (
          <View style={{ width: "100%", marginTop: 10 }}>
            {matches.length === 0 ? (
              <Text style={{ textAlign: "center", marginTop: 20 }}>No matches yet</Text>
            ) : (
              <FlatList
                data={matches}
                keyExtractor={(item) => item.id}
                extraData={matches}
                renderItem={({ item }) => {
                  const teamAName = item.teamA?.teamName || "-";
const teamBName = item.teamB?.teamName || "-";


                  const matchDate = item.matchDate
                    ? new Date(item.matchDate)
                    : new Date(item.createdAt);
                  const dateText = matchDate.toLocaleDateString();
                  const timeText = matchDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <View style={styles.realMatchCard}>
                      <View style={styles.matchRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.teamName}>{teamAName}</Text>
                          <Text style={styles.scoreText}>
                            Runs: {item.scoreA.runs} | Wickets: {item.scoreA.wickets} | Balls:{" "}
                            {item.scoreA.balls}
                          </Text>
                        </View>

                        <Text style={styles.vsText}>vs</Text>

                        <View style={{ flex: 1, alignItems: "flex-end" }}>
                          <Text style={styles.teamName}>{teamBName}</Text>
                          <Text style={styles.scoreText}>
                            Runs: {item.scoreB.runs} | Wickets: {item.scoreB.wickets} | Balls:{" "}
                            {item.scoreB.balls}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.infoText}>🏟 Venue: {item.venue || "TBD"}</Text>
                      <Text style={styles.infoText}>
                        📅 Date: {dateText} ⏰ Time: {timeText}
                      </Text>
                      <Text style={styles.infoText}>🎯 Stage: {item.stage || "N/A"}</Text>
                      <Text style={styles.infoText}>Overs: {item.overs}</Text>

                      {item.status === "completed" && item.winner && (
                        <Text style={[styles.infoText, { fontWeight: "bold", color: "#28a745" }]}>
                          🏆 Winner: {item.winner}
                        </Text>
                      )}

                      <View style={styles.matchFooter}>
                        <Text style={styles.dateText}>
                          Status:{" "}
                          <Text
                            style={{
                              color:
                                item.status === "completed"
                                  ? "#f44336"
                                  : item.status === "upcoming"
                                  ? "#007bff"
                                  : "#28a745",
                            }}
                          >
                            {item.status}
                          </Text>
                        </Text>

                        {isOrganizer && item.status === "upcoming" && (
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate("StartMatchScreen", {
                                tournamentId,
                                matchId: item.id,
                              })
                            }
                            style={{
                              backgroundColor: "#28a745",
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>Start Match</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}

            {isOrganizer && (
              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={[styles.equalButton, { backgroundColor: "#0cbee6ff" }]}
                  onPress={() =>
                    navigation.navigate("ScheduleMatchScreen", { tournamentId })
                  }
                >
                  <Text style={styles.buttonText}>Schedule Match</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === "Teams" && (
          <View style={{ marginTop: 20, width: "100%", paddingBottom: 30 }}>
            {isOrganizer ? (
              teams.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Teams List</Text>
                  <FlatList
                    data={teams}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("TeamDetailScreen", {
                            team: item,
                            tournamentId,
                            isOrganizer: true,
                          })
                        }
                      >
                        <View style={styles.teamCard}>
                          <Image
                            source={
                              item.logo
                                ? { uri: item.logo }
                                : require("../assets/t1.jpg")
                            }
                            style={styles.teamLogo}
                          />
                          <View>
                            <Text style={styles.teamName}>{item.teamName}</Text>
                            <Text style={styles.teamCaptain}>
                              Captain: {item.captainName}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                    ListFooterComponent={() => (
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: "#28a745", marginTop: 10 }]}
                        onPress={() =>
                          navigation.navigate("AddTeamScreen", { tournamentId })
                        }
                      >
                        <Text style={styles.buttonText}>Add New Team</Text>
                      </TouchableOpacity>
                    )}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.button, { width: "80%", alignSelf:"center", marginTop: 40 }]} onPress={inviteCaptains}>
                    <Text style={styles.buttonText}>Invite Captains</Text>
                  </TouchableOpacity>
                  <Text style={styles.orText}>OR</Text>
                  <TouchableOpacity
                    style={[styles.button, { width: "80%", backgroundColor: "#28a745", alignSelf:"center" }]}
                    onPress={() =>
                      navigation.navigate("AddTeamScreen", { tournamentId })
                    }
                  >
                    <Text style={styles.buttonText}>Add Team Manually</Text>
                  </TouchableOpacity>
                </>
              )
            ) : (
              <>
                <Text style={styles.sectionTitle}>Teams List</Text>
                {teams.length === 0 ? (
                  <Text style={{ textAlign: "center" }}>No teams added yet</Text>
                ) : (
                  <FlatList
                    data={teams}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.teamCard}>
                        <Image
                          source={
                            item.logo
                              ? { uri: item.logo }
                              : { uri: "https://cdn-icons-png.flaticon.com/512/2784/2784569.png" }
                          }
                          style={styles.teamLogo}
                        />
                        <View>
                          <Text style={styles.teamName}>{item.teamName}</Text>
                          <Text style={styles.teamCaptain}>
                            Captain: {item.captainName}
                          </Text>
                        </View>
                      </View>
                    )}
                  />
                )}
              </>
            )}
          </View>
        )}

{activeTab === "Points Table" && (
  <View style={{ alignItems: "center", marginTop: 20, width: "100%" }}>
    {isOrganizer ? (
  <>
    {!tournament.pointsTable ? (
      <TouchableOpacity
        style={[styles.button, { width: "80%", backgroundColor: "#ff9800", marginBottom: 10 }]}
        onPress={() => createPointsTable(tournamentId)}
      >
        <Text style={styles.buttonText}>Create Points Table</Text>
      </TouchableOpacity>
      
    ) : (
      <TouchableOpacity
        style={[styles.button, { width: "80%", backgroundColor: "#4CAF50", marginBottom: 10 }]}
        onPress={async () => {
  await generatePointsTable(tournamentId);
  alert("✅ Points Table updated successfully!");
}}

      >
        <Text style={styles.buttonText}>Update Points Table</Text>
      </TouchableOpacity>
    )}

    
  </>
) : null}


    <Text style={{ fontWeight: "bold", marginVertical: 10 }}>Points Table</Text>

    {tournament.pointsTable ? (
      <View style={styles.tableContainer}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.headerText]}>Team</Text>
          <Text style={[styles.tableCell, styles.headerText]}>P</Text>
          <Text style={[styles.tableCell, styles.headerText]}>W</Text>
          <Text style={[styles.tableCell, styles.headerText]}>L</Text>
          <Text style={[styles.tableCell, styles.headerText]}>T</Text>
          <Text style={[styles.tableCell, styles.headerText]}>NRR</Text>
          <Text style={[styles.tableCell, styles.headerText]}>Pts</Text>
        </View>

        {Object.entries(tournament.pointsTable).map(([teamId, t], index) => (
          <View
            key={teamId}
            style={[
              styles.tableRow,
              { backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff" },
            ]}
          >
            <Text style={styles.tableCell}>{t.teamName}</Text>
            <Text style={styles.tableCell}>{t.played || 0}</Text>
            <Text style={styles.tableCell}>{t.won || 0}</Text>
            <Text style={styles.tableCell}>{t.lost || 0}</Text>
            <Text style={styles.tableCell}>{t.tied || 0}</Text>
            <Text style={styles.tableCell}>{t.nrr?.toFixed(2) || 0}</Text>
            <Text style={styles.tableCell}>{t.points || 0}</Text>
          </View>
        ))}
      </View>
    ) : (
      <Text>No points table available yet</Text>
    )}
{isOrganizer && tournament.pointsTable && (
  <TouchableOpacity
    style={[
      styles.button,
      { backgroundColor: "#673AB7", marginTop: 20, width: "80%" },
    ]}
    onPress={() =>
      navigation.navigate("KnockoutScreen", {
        tournamentId,
        organiserId: tournament.organiserUid || tournament.createdBy, 
      })
    }
  >
    <Text style={styles.buttonText}>Go to Knockout Stage</Text>
  </TouchableOpacity>
)}




  </View>
)}




       
       {activeTab === "Stats" && (
  <View style={{ marginTop: 20, width: "100%", paddingBottom: 30 }}>
    <Text style={{ fontWeight: "bold", fontSize: 20, textAlign: "center", marginBottom: 15 }}>
      🏆 Tournament Stats
    </Text>

    {/* Top Run Scorers */}
    <Text style={styles.statsHeading}>🏏 Top Run Scorers</Text>
  {playerStats.topRuns.length > 0 ? (
  playerStats.topRuns.map((p, i) => (
    <View key={i} style={styles.statsRow}>
      <Text style={styles.statsRank}>{i + 1}.</Text>
      <Text style={styles.statsPlayer}>{p.name}</Text>
      <Text style={styles.statsTeam}>({p.team})</Text>
      <Text style={styles.statsValue}>{p.runs} runs</Text>

      {/* Per-match breakdown */}
      {playerMatchStats[p.name]?.map((m, idx) => (
        <Text key={idx} style={{ marginLeft: 20, fontSize: 12, color: "#555" }}>
          Match: {m.matchId} | Runs: {m.runs} | Wkts: {m.wickets} | 4s: {m.fours} | 6s: {m.sixes}
        </Text>
      ))}
    </View>
  ))
) : (
  <Text style={styles.noData}>No data available</Text>
)}


    {/* Top Wicket Takers */}
    <Text style={styles.statsHeading}>🎯 Top Wicket Takers</Text>
    {playerStats.topWickets.length > 0 ? (
      playerStats.topWickets.map((p, i) => (
        <View key={i} style={styles.statsRow}>
          <Text style={styles.statsRank}>{i + 1}.</Text>
          <Text style={styles.statsPlayer}>{p.name}</Text>
          <Text style={styles.statsTeam}>({p.team})</Text>
          <Text style={styles.statsValue}>{p.wickets} wkts</Text>
        </View>
      ))
    ) : (
      <Text style={styles.noData}>No data available</Text>
    )}

    {/* Most Fours */}
    <Text style={styles.statsHeading}>🔥 Most Fours</Text>
    {playerStats.topFours.length > 0 ? (
      playerStats.topFours.map((p, i) => (
        <View key={i} style={styles.statsRow}>
          <Text style={styles.statsRank}>{i + 1}.</Text>
          <Text style={styles.statsPlayer}>{p.name}</Text>
          <Text style={styles.statsTeam}>({p.team})</Text>
          <Text style={styles.statsValue}>{p.fours} fours</Text>
        </View>
      ))
    ) : (
      <Text style={styles.noData}>No data available</Text>
    )}

    {/* Most Sixes */}
    <Text style={styles.statsHeading}>💥 Most Sixes</Text>
    {playerStats.topSixes.length > 0 ? (
      playerStats.topSixes.map((p, i) => (
        <View key={i} style={styles.statsRow}>
          <Text style={styles.statsRank}>{i + 1}.</Text>
          <Text style={styles.statsPlayer}>{p.name}</Text>
          <Text style={styles.statsTeam}>({p.team})</Text>
          <Text style={styles.statsValue}>{p.sixes} sixes</Text>
        </View>
      ))
    ) : (
      <Text style={styles.noData}>No data available</Text>
    )}
  </View>
)}


      
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
    marginTop: 5,
  },
  tournamentLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  infoContainer: { marginLeft: 15, flex: 1 },
  name: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  dates: { fontSize: 14, color: "#555" },
  tabsScroll: { marginBottom: 15 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#aaa",
    marginRight: 10,
  },
  activeTab: { backgroundColor: "#007bff", borderColor: "#007bff" },
  tabText: { color: "#333" },
  activeTabText: { color: "#fff" },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: 20,
  },
  equalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  teamLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  teamName: { fontSize: 17, fontWeight: "700", color: "#222" },
  teamCaptain: { fontSize: 14, color: "#666", marginTop: 2 },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 10, textAlign: "center" },
  orText: { marginVertical: 15, fontWeight: "bold", color: "#444", textAlign: "center" },
  realMatchCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  matchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  vsText: { fontSize: 16, fontWeight: "700", color: "#333", marginHorizontal: 10 },
  dateText: { fontSize: 12, color: "#666" },
  infoText: { fontSize: 14, color: "#555", marginTop: 3 },
  tableContainer: { width: "105%", borderWidth: 1, borderColor: "#ddd", borderRadius: 8 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", padding: 8 },
  tableHeader: { backgroundColor: "#007bff" },
  tableCell: { flex: 1, textAlign: "center", fontSize: 14 },
  headerText: { color: "#fff", fontWeight: "700" },
  setHeroesButton: {
    backgroundColor: "#ff5722",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  setHeroesButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  heroesTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  heroCard: { padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: "#ddd" },
  heroName: { fontWeight: "700", fontSize: 16 },
  heroDetail: { fontSize: 14, color: "#555", marginTop: 2 },


  "pointsTable": {
  "Hajjs": {
    "teamName": "Hajjs",
    "played": 1,
    "won": 1,
    "lost": 0,
    "tied": 0,
    "points": 2
  },
  "XYZ": {
    "teamName": "XYZ",
    "played": 1,
    "won": 0,
    "lost": 1,
    "tied": 0,
    "points": 0
  }

  
},
statsHeading: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#007bff",
  marginVertical: 8,
  paddingLeft: 5,
},
statsRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 6,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},
statsRank: { fontWeight: "bold", width: 25, textAlign: "center" },
statsPlayer: { flex: 1, fontSize: 15, color: "#333" },
statsTeam: { fontSize: 13, color: "#666", width: 100 },
statsValue: { fontWeight: "600", color: "#111" },
noData: { textAlign: "center", color: "#999", marginVertical: 4 },




});




export default TournamentDetails;
