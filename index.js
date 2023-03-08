const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

function playerDetailsFormat(dbObject) {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
}

function getMatchDetails(OBJ) {
  return {
    matchId: OBJ.match_id,
    match: OBJ.match,
    year: OBJ.year,
  };
}

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};

InitializeDBAndServer();

// Get All players details

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `SELECT * FROM player_details;`;
  const DbRes = await db.all(getAllPlayersQuery);
  const result = DbRes.map(playerDetailsFormat);
  response.send(result);
});

// Get Specific player details

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const DbRes = await db.get(getPlayerQuery);
  const result = playerDetailsFormat(DbRes);
  response.send(result);
});

// Update player details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `UPDATE player_details SET player_name = '${playerName}';`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

// Get specific match details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const DbRes = await db.get(getMatchQuery);
  const result = getMatchDetails(DbRes);
  response.send(result);
});

// Get all match details of the player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `SELECT 
  match_details.match_id as matchId ,
  match_details.match as match,
  match_details.year as year
  FROM 
  player_match_score INNER JOIN match_details 
  ON 
  player_match_score.match_id = match_details.match_id
  WHERE 
  player_match_score.player_id = ${playerId};`;
  const DbRes = await db.all(getPlayerMatches);
  response.send(DbRes);
});

// Get all Players details of the match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatch = `SELECT 
  player_details.player_id as playerId,
  player_details.player_name as playerName
  FROM 
  player_details INNER JOIN player_match_score
  ON 
  player_match_score.player_id = player_details.player_id
  WHERE 
  match_id = ${matchId};`;
  const DbRes = await db.all(getPlayersOfMatch);
  response.send(DbRes);
});

// Get Stats of the player
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStats = `SELECT 
  player_details.player_id as playerId,
  player_details.player_name as playerName,
  SUM(score) as totalScore,
  SUM(fours) as totalFours,
  SUM(sixes) As totalSixes
  FROM 
  player_details INNER JOIN player_match_score
  ON 
  player_match_score.player_id = player_details.player_id
  WHERE
  player_details.player_id = ${playerId};`;
  const DbRes = await db.get(getPlayerStats);
  response.send(DbRes);
});
module.exports = app;
