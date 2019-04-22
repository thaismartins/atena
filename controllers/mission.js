import userController from "./user";
import MissionModel from "../models/mission";
import {
  sendedToAnotherUser,
  generateLimitDate,
  getSenderUsername,
  isAcceptedAnswer,
  isInLimitDate,
  userAbleToReceiveNewMission,
  isInDailyLimit
} from "../utils/missions";
import rocket from "../rocket/api";
import { sendToUser } from "../rocket/bot";
import minerController from "./miner";

const commandIndex = async data => {
  return await defaultFunctions.create(data);
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

    if (sendedToAnotherUser(data.msg, sender.username)) {
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
    response = "Uhuul! Sua nova missão foi criada! :)";
  } else {
    response =
      "Ops! Você não pode mais receber nenhuma missão por enquanto. :(";
  }

  return response;
};

const createToAnotherUser = async (sender, data) => {
  let response = "Ops! Não podemos gerar uma nova missão. :(";
  const username = getSenderUsername(data.msg);
  const receiver = await getRecieverByUsername(username);

  if (!receiver) {
    response =
      "Ops! Não encontramos o usuário que deseja enviar uma missão. :(";
    return response;
  }

  const isAbled = await userAbleToReceiveNewMission(receiver);
  if (isAbled) {
    const mission = await defaultFunctions.save(receiver, sender, {});
    await sendToUser(generateMessage(mission._id), username);
    response = `Uhuul! Uma nova missão foi enviada para @${username}. :)`;
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

const answer = async data => {
  if (!data.researchHash) {
    return;
  }

  let response = {
    text: "Ops! Não conseguimos encontrar sua missão. :("
  };

  try {
    const mission = await MissionModel.findById(data.researchHash).exec();
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
        "Poxa, já passou a data limite para entrar nessa missão. :(";
      return response;
    }

    if (isAcceptedAnswer(data.msg)) {
      const quiz = await minerController.getNewQuiz();
      await acceptMission(mission, quiz);
      response.text =
        "Oba, missão foi aceita! :) \n Aguarde sua enquete chegará em breve.";
    } else {
      await refuseMission(mission);
      response.text =
        "Que pena que não deseja participar dessa luta. \n Mas quando mudar de ideia, só enviar *!missao* que te enviamos uma missão novinha! ;)";
    }
  } catch (error) {
    console.log("error", error);
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

const getRecieverByUsername = async username => {
  if (username) {
    const rocketUser = await rocket.getUserInfoByUsername(username);
    if (rocketUser) {
      return await userController.findByOrigin({
        origin: "rocket",
        user: rocketUser._id
      });
    }
  }

  return false;
};

const generateMessage = missionId => {
  let optionsText = "";
  let reactions = {};

  const options = [
    {
      value: ":+1:",
      label: "Aceitar"
    },
    {
      value: ":-1:",
      label: "Recusar"
    }
  ];

  options.forEach(option => {
    optionsText += ` ${option.value} ${option.label} \n\n`;
    reactions[`${option.value}`] = { usernames: ["atena-thais-bot"] }; // TODO: encontrar dado do bot
  });

  return {
    msg: `*Nobre guerreiro(a), você acabou de receber uma nova missão!* \n\n ${optionsText} \n **Responda clicando em uma das opções a seguir:**`,
    researchHash: missionId, // TODO: encrypt
    reactions
  };
};

const defaultFunctions = {
  commandIndex,
  create,
  createToAnotherUser,
  createToSameUser,
  answer,
  save
};

export default defaultFunctions;
