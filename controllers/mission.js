import userController from "./user";
import MissionModel from "../models/mission";
import {
  hasUserToSend,
  generateLimitDate,
  getSenderUsername
} from "../utils/missions";
import {
  getNewQuiz
} from "../utils/miner";
import {
  getUserInfoByUsername
} from "../rocket/api";

const commandIndex = async data => {
  let response = {
    text: "Ops! Não podemos gerar uma nova missão. :("
  };

  let interaction = {
    origin: "rocket",
    user: data.u._id
  };

  let sender = await userController.findByOrigin(interaction);
  let reciever;
  let accepted = false;

  if (sender) {
    if (hasUserToSend(data.msg)) {
      console.log("TODO! Enviado por outro usuário.");
      reciever = await getReciever(data.msg);
      if (reciever) {
        console.log('reciever', reciever);
      }
    } else {
      console.log("TODO! Enviado por mesmo usuário.");
      reciever = sender; // TODO: verificar melhor solução
      accepted = true;
    }

    let quiz = getNewQuiz();
    let mission = new MissionModel({
      kind: "network.mission.quiz",
      kindId: quiz.id, // TODO: substituir por id do miner,
      user: reciever._id,
      createdBy: sender._id,
      limitDate: generateLimitDate(),
      accepted: accepted
    });

    // TODO: validar se tem usuário
    // Não tem
    // TODO: se já tem 2 ao mesmo tempo - Ops! Você não pode mais receber nenhuma missão por enquanto. :(

    // TODO: buscar missao do miner

    // TODO: se foi enviado por outra pessoa, mandar mensagem para pessoa
    // TODO: salvar conquistas
  }

  return response;
};

const save = async data => {
  console.log(data);
};

const getReciever = async data => {
  const username = getSenderUsername(data);

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

export default {
  save,
  commandIndex
};
