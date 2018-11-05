import config from "config-yml";
import mongoose from "mongoose";
import { _throw } from "../helpers";

const checkBadge = async (type, badge, user) => {
  const BadgeModel = mongoose.model("Badge");
  console.log("badge", badge);
  if (!badge) return false;
  const indexOf = badge[0] ? badge[0].level : 0;

  console.log("indexOf", indexOf);
  console.log("if", user[type] < config.badges[indexOf].value);
  if (user[type] < config.badges[indexOf].value) return false;

  const instance = new BadgeModel({
    user: user.slackId,
    name: type,
    level: indexOf + 1,
    type: "permanent"
  });
  const response = instance.save();
  return response || _throw("Error adding new badge");
};

const save = async user => {
  console.log("user", user);
  const BadgeModel = mongoose.model("Badge");
  ["message", "replies", "reactions"].forEach(async type => {
    await BadgeModel.find({
      name: type,
      user: user.slackId
    })
      .sort({ level: -1 })
      .limit(1)
      .exec(function(error, response) {
        checkBadge(type, response, user);
      });
  });

  return true;
};

export default {
  save
};
