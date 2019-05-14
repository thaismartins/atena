import config from "config-yml";
import rocketApi from "../rocket/api";
import ConfigModel from "../models/config";
import interactionController from "../controllers/interaction";

export const isEligibleToPro = (user, data) => {
  console.log("data", data);
  return (
    (data.current_plan && data.current_plan.name) ||
    user.level > 2 ||
    userRoles(user)
  );
};

export const userRoles = async user => {
  const userInfo = await rocketApi.getUserInfo(user.rocketId);
  const allowedRoles = ["moderator", "owner", "ambassador"]; //ConfigModel.find({ name: "proRoles" }).exec(); // TODO: find model
  return userInfo.roles.filter(r => allowedRoles.includes(r));
};

export const saveOnLinkedin = async (user, data) => {
  let onLinkedin = false;
  if (!user.onLinkedin && data.impulso_on_linkedin) {
    await addingInteraction(
      data,
      "Você recebeu pontos por dizer no LinkedIn que faz parte da Impulso",
      config.xprules.linkedin
    );
    onLinkedin = true;
  }

  return onLinkedin;
};

export const saveOpportunities = async (user, data) => {
  let opportunities = user.opportunities;
  if (data.opportunities_feed.length) {
    let text, value;

    switch (data.opportunities_feed.status) {
      case "interview":
        text =
          "Você recebeu pontos por participar da entrevista de uma oportunidade";
        value = config.xprules.team.interview;
        break;
      case "approved":
        text = "Você recebeu pontos por ser aprovado para uma oportunidade";
        value = config.xprules.team.approved;
        break;
      case "allocated":
        text = "Você recebeu pontos por ser alocado em uma oportunidade";
        value = config.xprules.team.allocated;
        break;
      default:
        text = "Esta é uma interação sem pontos";
        value = 0;
        break;
    }
  }
};

export const saveReferrers = async (user, data) => {
  let referrers = user.referrers;
  let newReferers = getNewReferrers(user, data);

  if (newReferers.length) {
    newReferers.map(async referrer => {
      await addingInteraction(
        data,
        "Você recebeu pontos por indicar a Impulso",
        config.xprules.referral
      );
      referrers.push({
        uuid: referrer.uuid,
        status: referrer.status
      });
    });
  }

  return referrers;
};

export const addingInteraction = async (data, text, score) => {
  await interactionController.manualInteractions({
    type: "manual",
    user: data.rocket_chat.id,
    username: data.rocket_chat.username,
    text: text,
    value: score,
    score: score
  });
};

export const getNewReferrers = (user, data) => {
  // TODO: retornar somente novos
  return true;
};
