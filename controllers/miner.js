import axios from "axios";
import { isValidToken } from "../utils/teams";

const isMiner = async (req, res) => {
  const miner = /miner/g;
  const { team, token } = req.headers;
  const isMiner = miner.test(req.originalUrl) || false;
  if ((isMiner && !team) || (isMiner && !isValidToken(team, token))) {
    res.sendStatus(401);
    return;
  }
  return isMiner;
};

const getNewQuiz = async user => {
  if (!user.uuid) return;

  const url = `${process.env.MINER_URL}/questions/next/${user.uuid}`;
  return await axios.post(url, {
    accept: "json"
  });
};

const exportFunctions = {
  isMiner,
  getNewQuiz
};

export default exportFunctions;
