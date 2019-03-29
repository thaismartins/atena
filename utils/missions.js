import moment from "moment-timezone";
import config from "config-yml";

export const hasUserToSend = data => {
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
