import userController from "./user";
import MissionModel from "../models/mission";
import { hasUserToSend, generateLimitDate } from "../utils/missions";
import { getNewQuiz } from "../utils/miner";

const commandIndex = async data => {
  console.log("entrou no commandIndex", data);

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
    if (hasUserToSend()) {
      console.log("TODO! Enviado por outro usuário.");
    } else {
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

export default {
  save,
  commandIndex
};
