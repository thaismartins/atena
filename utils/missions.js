import moment from "moment-timezone";
import config from "config-yml";

export const hasUserToSend = () => {
  return false;
};

export const getSenderUsername = () => {
  return true;
};

export const generateLimitDate = () => {
  return moment(Date.Now)
    .startOf("day")
    .utc()
    .add(config.missions.quiz.limitDate, "days")
    .endOf("day")
    .toISOString();
};
