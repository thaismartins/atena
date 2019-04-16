import config from "config-yml";

import userController from "./user";
import MissionModel from "../models/mission";
import {
  sendedToAnotherUser,
  generateLimitDate,
  getSenderUsername,
  isAnswer
} from "../utils/missions";
import { getNewQuiz } from "../utils/miner";
import { getUserInfoByUsername, sendMessageTest } from "../rocket/api";
import { sendToUser } from "../rocket/bot";

const commandIndex = async data => {
  let response;
  if (isAnswer(data)) {
    response = await answer(data);
  } else {
    response = await create(data);
  }

  return response;
};

const create = async data => {
  let response = {
    text: "Ops! Não podemos gerar uma nova missão. :("
  };

  let interaction = {
    origin: "rocket",
    user: data.u._id
  };

  let sender = await userController.findByOrigin(interaction);
  let reciever;
  let username;
  let hasOtherReciever = false;

  if (sender) {
    reciever = sender;

    if (sendedToAnotherUser(data.msg)) {
      username = getSenderUsername(data.msg);
      reciever = await getRecieverByUsername(username);

      if (!reciever) {
        response = {
          text:
            "Ops! Não encontramos o usuário que deseja enviar uma missão. :("
        };
        return;
      }

      hasOtherReciever = true;
    }

    if (userCanGetNewMission(reciever)) {
      // TODO: buscar missao do miner
      let quiz = await getNewQuiz();
      let mission = new MissionModel({
        category: "network",
        kind: "quiz",
        kindId: quiz.id, // TODO: substituir por id do miner,
        user: reciever._id,
        createdBy: sender._id,
        limitDate: generateLimitDate(),
        accepted: hasOtherReciever ? false : true
      });

      await mission.save();

      if (hasOtherReciever) {
        await sendToUser(generateMessage(), username);
        response.text = `Uhuul! Uma nova missão foi enviada para @${username}. :)`;
      } else {
        response.text = "Uhuul! Sua nova missão foi criada! :)";
      }
    } else {
      if (hasOtherReciever) {
        response.text =
          "Ops! Este guerreiro(a) não pode mais receber nenhuma missão por enquanto. :(";
      } else {
        response.text =
          "Ops! Você não pode mais receber nenhuma missão por enquanto. :(";
      }
    }
  }

  return response;
};

const answer = async data => {
  // TODO: alterar startDate e limitDate
  // TODO: alterar accepted

  if (answerOnDeadLinete()) {
  }
  console.log(data);
  return {
    text: "É uma resposta..."
  };
};

const save = async data => {
  console.log(data);
};

const getRecieverByUsername = async username => {
  if (username) {
    const rocketUser = await getUserInfoByUsername(username);
    if (rocketUser) {
      return await userController.findByOrigin({
        origin: "rocket",
        user: rocketUser._id
      });
    }
  }

  return false;
};

const generateMessage = () => {
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
    optionsText += ` ${option.value} ${option.label} `;
    reactions[`${option.value}`] = { usernames: ["atena-thais-bot"] }; // TODO: encontrar dado do bot
  });

  return {
    msg: `*Nobre guerreiro(a), você acabou de receber uma nova missão! \n\n ${optionsText} \n **Responda clicando em uma das opções a seguir:**`,
    reactions
  };
};

const userCanGetNewMission = async user => {
  let missions = await MissionModel.find({
    user: user,
    accepted: true,
    completed: false
  });

  return missions.length < 2;
};

export default {
  save,
  commandIndex
};
