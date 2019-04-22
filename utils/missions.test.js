import config from "config-yml";
import moment from "moment-timezone";
import {
  sendedToAnotherUser,
  getSenderUsername,
  generateLimitDate,
  isAcceptedAnswer,
  isInLimitDate,
  isInDailyLimit,
  userAbleToReceiveNewMission
} from "./missions";
import { interactionWithReaction } from "../mocks/interactions";
import { missionNotAccepted } from "../mocks/missions";
import model from "../models/mission";

let today;

describe.only("Missions Util", () => {
  beforeEach(() => (today = moment(new Date()).utc()));

  describe("sendedToAnotherUser", () => {
    it("should return false to message without user", done => {
      const hasAnotherUser = sendedToAnotherUser("!missao", "john-doe");
      expect(hasAnotherUser).toBeFalsy();
      done();
    });

    it("should return false to message with his own user", done => {
      const hasAnotherUser = sendedToAnotherUser(
        "!missao @john-doe",
        "john-doe"
      );
      expect(hasAnotherUser).toBeFalsy();
      done();
    });

    it("should return false to message with another user", done => {
      const hasAnotherUser = sendedToAnotherUser("!missao @mary", "john-doe");
      expect(hasAnotherUser).toBeTruthy();
      done();
    });
  });

  describe("getSenderUsername", () => {
    it("should return username 'john-doe'", done => {
      const username = getSenderUsername("!missao @john-doe");
      expect(username).toBe("john-doe");
      done();
    });

    it("should return username 'john-doe'", done => {
      const username = getSenderUsername("!missao @john-doe ");
      expect(username).toBe("john-doe");
      done();
    });

    it("should return username 'mary'", done => {
      const username = getSenderUsername("!missao @mary");
      expect(username).toBe("mary");
      done();
    });

    it("should return username 'mary'", done => {
      const username = getSenderUsername("!missao @mary ");
      expect(username).toBe("mary");
      done();
    });

    it("should return false to message without username", done => {
      const username = getSenderUsername("!missao");
      expect(username).toBeFalsy();
      done();
    });

    it("should return false to message without username", done => {
      const username = getSenderUsername("!missao ");
      expect(username).toBeFalsy();
      done();
    });

    it("should return false to message without username", done => {
      const username = getSenderUsername("!missao @");
      expect(username).toBeFalsy();
      done();
    });
  });

  describe("generateLimitDate", () => {
    it("should return same difference days from config", done => {
      const limitDate = generateLimitDate();
      var now = moment(new Date());
      var end = moment(limitDate);
      var duration = moment.duration(end.diff(now));
      var days = parseInt(duration.asDays());
      expect(days).toBe(config.missions.quiz.limit.date);
      done();
    });
  });

  describe("isAcceptedAnswer", () => {
    it("should return true to empty reaction", done => {
      const interaction = JSON.parse(JSON.stringify(interactionWithReaction));
      interaction.description = "";
      const isAccepted = isAcceptedAnswer(interaction);
      expect(isAccepted).toBeFalsy();
      done();
    });

    it("should return true to another reaction", done => {
      const interaction = JSON.parse(JSON.stringify(interactionWithReaction));
      const isAccepted = isAcceptedAnswer(interaction);
      expect(isAccepted).toBeFalsy();
      done();
    });

    it("should return true to negative :-1: reaction", done => {
      const interaction = JSON.parse(JSON.stringify(interactionWithReaction));
      interaction.description = ":-1:";
      const isAccepted = isAcceptedAnswer(interaction);
      expect(isAccepted).toBeFalsy();
      done();
    });

    it("should return true to negative :thumbsdown: reaction", done => {
      const interaction = JSON.parse(JSON.stringify(interactionWithReaction));
      interaction.description = ":thumbsdown:";
      const isAccepted = isAcceptedAnswer(interaction);
      expect(isAccepted).toBeFalsy();
      done();
    });

    it("should return true to positive :+1:", done => {
      const interaction = JSON.parse(JSON.stringify(interactionWithReaction));
      interaction.description = ":+1:";
      const isAccepted = isAcceptedAnswer(interaction);
      expect(isAccepted).toBeTruthy();
      done();
    });

    it("should return true to positive :thumbsup:", done => {
      const interaction = JSON.parse(JSON.stringify(interactionWithReaction));
      interaction.description = ":thumbsup:";
      const isAccepted = isAcceptedAnswer(interaction);
      expect(isAccepted).toBeTruthy();
      done();
    });
  });

  describe("isInLimitDate", () => {
    it("should return true to today", done => {
      const isInLimit = isInLimitDate(today.format());
      expect(isInLimit).toBeTruthy();
      done();
    });

    it("should return true to tomorrow", done => {
      const tomorrow = today.add(1, "d").format();
      const isInLimit = isInLimitDate(tomorrow);
      expect(isInLimit).toBeTruthy();
      done();
    });

    it("should return true to limit date", done => {
      const limitDate = today
        .add(config.missions.quiz.limit.date, "d")
        .format();
      const isInLimit = isInLimitDate(limitDate);
      expect(isInLimit).toBeTruthy();
      done();
    });

    it("should return false to yesterday", done => {
      const yesterday = today.subtract(1, "d").format();
      const isInLimit = isInLimitDate(yesterday);
      expect(isInLimit).toBeFalsy();
      done();
    });

    it("should return false to 3 ago", done => {
      const yesterday = today.subtract(3, "d").format();
      const isInLimit = isInLimitDate(yesterday);
      expect(isInLimit).toBeFalsy();
      done();
    });
  });

  describe("isInDailyLimit", () => {
    it("should return true to 0 mission accepted", async done => {
      const spy = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve([]));
      const isInLimit = await isInDailyLimit(missionNotAccepted.user);
      expect(spy).toHaveBeenCalled();
      expect(isInLimit).toBeTruthy();
      done();
    });

    it("should return true to 1 mission accepted", async done => {
      const spy = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve([missionNotAccepted]));
      const isInLimit = await isInDailyLimit(missionNotAccepted.user);
      expect(spy).toHaveBeenCalled();
      expect(isInLimit).toBeTruthy();
      done();
    });

    it("should return false to 2 mission accepted", async done => {
      const spy = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() =>
          Promise.resolve([missionNotAccepted, missionNotAccepted])
        );
      const isInLimit = await isInDailyLimit(missionNotAccepted.user);
      expect(spy).toHaveBeenCalled();
      expect(isInLimit).toBeFalsy();
      done();
    });
  });

  describe("userAbleToReceiveNewMission", () => {
    it("should return true to 0 mission accepted", async done => {
      const spy = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve([]));
      const isInLimit = await userAbleToReceiveNewMission(
        missionNotAccepted.user
      );
      expect(spy).toHaveBeenCalled();
      expect(isInLimit).toBeTruthy();
      done();
    });

    it("should return true to 1 mission accepted", async done => {
      const spy = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve([missionNotAccepted]));
      const isInLimit = await userAbleToReceiveNewMission(
        missionNotAccepted.user
      );
      expect(spy).toHaveBeenCalled();
      expect(isInLimit).toBeTruthy();
      done();
    });

    it("should return false to 2 mission accepted", async done => {
      const spy = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() =>
          Promise.resolve([missionNotAccepted, missionNotAccepted])
        );
      const isInLimit = await userAbleToReceiveNewMission(
        missionNotAccepted.user
      );
      expect(spy).toHaveBeenCalled();
      expect(isInLimit).toBeFalsy();
      done();
    });
  });
});
