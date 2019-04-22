import moment from "moment-timezone";
import config from "config-yml";

import MissionModel from "../models/mission";

export const sendedToAnotherUser = (message, user) => {
  const sendedUser = getSenderUsername(message);
  return message.includes("@") && sendedUser !== user;
};

export const getSenderUsername = message => {
  return (
    message
      .replace(/.*@/, "")
      .replace("!missao", "")
      .trim() || false
  );
};

export const generateLimitDate = () => {
  return moment(Date.Now)
    .startOf("day")
    .utc()
    .add(config.missions.quiz.limit.date, "days")
    .endOf("day")
    .toISOString();
};

export const isAcceptedAnswer = data => {
  return (
    data.description &&
    (data.description.includes(":+1:") ||
      data.description.includes(":thumbsup:"))
  );
};

export const isInLimitDate = date => {
  const today = moment(new Date())
    .utc()
    .format();
  return moment(new Date(date)).isSameOrAfter(today);
};

export const isInDailyLimit = async user => {
  let missions = await MissionModel.find({
    user: user,
    accepted: true,
    acceptedDate: { $exists: true, $not: { $type: 10 } },
    completed: false
  });

  return missions.length < config.missions.quiz.limit.simultaneously;
};

export const userAbleToReceiveNewMission = async user => {
  let missions = await MissionModel.find({
    $or: [
      {
        user: user,
        accepted: true,
        acceptedDate: { $exists: true, $not: { $type: 10 } },
        completed: false
      },
      {
        user: user,
        accepted: false,
        completed: false,
        refuseDate: { $exists: false }
      }
    ]
  });

  return missions.length < config.missions.quiz.limit.simultaneously;
};
