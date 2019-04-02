import moment from "moment-timezone";
import config from "config-yml";

export const sendedToAnotherUser = data => {
  // TODO: validar se não foi enviado para ele mesmo
  return data.includes("@");
};

export const getSenderUsername = data => {
  return data.replace(/.*@/, "") || false;
};

export const generateLimitDate = () => {
  return moment(Date.Now)
    .startOf("day")
    .utc()
    .add(config.missions.quiz.limitDate, "days")
    .endOf("day")
    .toISOString();
};

export const isAnswer = data => {
  data = data.msg.toString().toLowerCase();
  console.log("data", data);
  console.log("sim", data.includes("sim"));
  console.log("não", data.includes("não"));
  return data.includes("sim") || data.includes("não");
};
