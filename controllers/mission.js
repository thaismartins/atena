import moment from "moment-timezone";
import config from "config-yml";

import userController from "./user";
import interactionController from "./interaction";
import MissionModel from "../models/mission";
import InteractionModel from "../models/interaction";
import {
  sendedToAnotherUser,
  generateLimitDate,
  getRocketSender,
  isAcceptedAnswer,
  isInLimitDate,
  userAbleToReceiveNewMission,
  isInDailyLimit,
  generateMessage,
  isRefusedAnswer,
  convertToMissionData
} from "../utils/missions";
import { sendToUser } from "../rocket/bot";
import minerController from "./miner";

const commandIndex = async data => {
  const response = await defaultFunctions.create(data);
  await sendToUser(response.text, data.u.username);
  return response;
};

const create = async data => {
  let response = {
    text: "Ops! Não podemos gerar uma nova missão. :("
  };

  try {
    let sender = await userController.findByOrigin({
      origin: "rocket",
      user: data.u._id
    });

    if (sendedToAnotherUser(data, sender.username)) {
      response.text = await defaultFunctions.createToAnotherUser(sender, data);
    } else {
      response.text = await defaultFunctions.createToSameUser(sender);
    }
  } catch (error) {
    console.log("error", error);
    console.log("Error on create a mission");
  }
  return response;
};

const createToSameUser = async sender => {
  let response = "Ops! Não podemos gerar uma nova missão. :(";
  const isAbled = await userAbleToReceiveNewMission(sender);
  if (isAbled) {
    const quiz = await minerController.getNewQuiz();
    await defaultFunctions.save(sender, sender, quiz);
    response = "Uhuul! Sua nova missão foi criada! :muscle:";
  } else {
    response =
      "Ops! Você não pode mais receber nenhuma missão por enquanto. :(";
  }

  return response;
};

const createToAnotherUser = async (sender, data) => {
  let response = "Ops! Não podemos gerar uma nova missão. :(";
  if (!data.mentions.length) return response;

  const rocketUser = getRocketSender(data);
  const receiver = await userController.findByOrigin({
    origin: "rocket",
    user: rocketUser._id
  });

  if (!receiver) {
    response =
      "Ops! Não encontramos o usuário que deseja enviar uma missão. :(";
    return response;
  }

  const isAbled = await userAbleToReceiveNewMission(receiver);
  if (isAbled) {
    const mission = await defaultFunctions.save(receiver, sender, {});
    await sendToUser(
      generateMessage(mission._id, sender.username),
      rocketUser.username
    );
    response = `Uhuul! Uma nova missão foi enviada para @${
      rocketUser.username
    }! :muscle:`;
  } else {
    response = "Ops! Este guerreiro(a) não pode receber mais missões. :(";
  }

  return response;
};

const save = async (receiver, sender, quiz) => {
  let mission = {
    category: "network",
    kind: "quiz",
    kindId: quiz._id || null,
    user: receiver._id,
    createdBy: sender._id,
    limitDate: generateLimitDate()
  };

  if (receiver._id === sender._id) {
    mission.accepted = true;
    mission.acceptedDate = Date.now();
  }

  const newMission = new MissionModel(mission);
  return await newMission.save();
};

const answer = async message => {
  const data = convertToMissionData(message);
  if (!data || !data.researchHash || !data.reaction) {
    return;
  }

  let response = {
    text: "Ops! Não conseguimos encontrar sua missão. :("
  };

  if (!isAcceptedAnswer(data) && !isRefusedAnswer(data)) {
    response.text = "Responda com :+1: para aceitar e :-1: para recusar.";
    return response;
  }

  try {
    const mission = await MissionModel.find({ _id: data.researchHash });
    if (!mission) {
      return response;
    }

    if (mission.refusedDate || mission.acceptedDate) {
      response.text = "Você já respondeu a esse desafio! :)";
      return response;
    }

    const isAbled = await isInDailyLimit(mission.limitDate);
    if (!isAbled) {
      response.text =
        "Poxa, já tem 2 missão ativas. Finalize as missões anteriores para poder participar de novas. :(";
      return response;
    }

    if (!isInLimitDate(mission.limitDate)) {
      response.text =
        "Que pena, já passou a data limite para entrar nessa missão. :(";
      return response;
    }

    if (isAcceptedAnswer(data)) {
      const quiz = await minerController.getNewQuiz();
      await defaultFunctions.acceptMission(mission, quiz);
      response.text =
        "Oba, missão foi aceita! :) \n Aguarde sua enquete chegará em breve.";
    } else if (isRefusedAnswer(data)) {
      await defaultFunctions.refuseMission(mission);
      response.text =
        "Que pena que não deseja participar dessa luta. \n Mas quando mudar de ideia, só enviar *!missao* que te enviamos uma missão novinha! ;)";
    }
  } catch (error) {
    console.log("Error on answer a mission");
  }

  return response;
};

const acceptMission = async (mission, quiz) => {
  mission.acceptedDate = Date.now();
  mission.startDate = Date.now();
  mission.limitDate = generateLimitDate();
  mission.accepted = true;
  mission.kind = "quiz";
  mission.kindId = quiz._id;
  return await mission.save();
};

const refuseMission = async mission => {
  mission.accepted = false;
  mission.refusedDate = Date.now();
  return await mission.save();
};

const completeMission = async mission => {
  mission.completed = true;
  mission.completedDate = Date.now();
  await mission.save();

  const user = await userController.findBy({ _id: mission.user });
  const score = mission.user.equals(mission.createdBy)
    ? config.missions.quiz.xp.owner
    : config.missions.quiz.xp.atena;
  await userController.updateScore(user, score);

  const interactionData = interactionController.normalize({
    type: "manual",
    user: user.rocketId,
    rocketUsername: user.username,
    score: score,
    value: mission._id,
    text: "Missão Finalizada"
  });

  const interaction = new InteractionModel(interactionData);
  await interaction.save();
};

const findInactivities = async () => {
  const end = moment().format("YYYY-MM-DD");
  const missions = await MissionModel.find({
    accepted: false,
    refusedDate: { $exists: false },
    limitDate: { $lte: end }
  }).exec();
  return missions;
};

const findIncompletes = async () => {
  const missions = await MissionModel.find({
    accepted: true,
    completed: false,
    completedDate: { $exists: false },
    refusedDate: { $exists: false }
  }).exec();
  return missions;
};

const defaultFunctions = {
  commandIndex,
  create,
  createToAnotherUser,
  createToSameUser,
  acceptMission,
  refuseMission,
  completeMission,
  findInactivities,
  findIncompletes,
  answer,
  save
};

export default defaultFunctions;
