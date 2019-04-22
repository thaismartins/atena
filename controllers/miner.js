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
  // TODO: buscar no miner
  return {
    _id: 12345678
  };
};

const exportFunctions = {
  isMiner,
  getNewQuiz
};

export default exportFunctions;
