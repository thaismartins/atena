import config from "config-yml";
import moment from "moment-timezone";
import {
  sendedToAnotherUser,
  getRocketSender,
  generateLimitDate,
  isAcceptedAnswer,
  isInLimitDate,
  isInDailyLimit,
  userAbleToReceiveNewMission,
  isRefusedAnswer,
  convertToMissionData
} from "./missions";
import { missionNotAccepted } from "../mocks/missions";
import model from "../models/mission";
import {
  messageWithAnswerMissionRefused,
  messageWithAnswerMissionAccepted
} from "../mocks/rocket";

let today;

describe.only("Missions Util", () => {
  beforeEach(() => (today = moment(new Date()).utc()));

  describe("sendedToAnotherUser", () => {
    it("should return false to message without user", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.msg = "!missao";
      message.mentions = [];
      const hasAnotherUser = sendedToAnotherUser(message);
      expect(hasAnotherUser).toBeFalsy();
      done();
    });

    it("should return false to message with his own user", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.u = message.mentions[0];
      const hasAnotherUser = sendedToAnotherUser(message);
      expect(hasAnotherUser).toBeFalsy();
      done();
    });

    it("should return true to message with another user", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      const hasAnotherUser = sendedToAnotherUser(message);
      expect(hasAnotherUser).toBeTruthy();
      done();
    });

    it("should return true to message with more than one user", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.msg = "!missao @john-doe @mary";
      message.mentions[1] = JSON.parse(JSON.stringify(message.mentions[0]));
      message.mentions[1].name = "Mary";
      message.mentions[1].username = "mary";
      const hasAnotherUser = sendedToAnotherUser(message);
      expect(hasAnotherUser).toBeTruthy();
      done();
    });
  });

  describe("getRocketSender", () => {
    it("should return false to message without user", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.msg = "!missao";
      const user = getRocketSender(message);
      expect(user).toBeFalsy();
      done();
    });

    it("should return false to message without username", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.msg = "!missao @";
      const user = getRocketSender(message);
      expect(user).toBeFalsy();
      done();
    });

    it("should return false to message without user and no mentions", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.msg = "!missao";
      message.mentions = [];
      const user = getRocketSender(message);
      expect(user).toBeFalsy();
      done();
    });

    it("should return false to message with different user for mentions", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.msg = "!missao @mary";
      const user = getRocketSender(message);
      expect(user).toBeFalsy();
      done();
    });

    it("should return false to message with his own user", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.u = message.mentions[0];
      const hasAnotherUser = getRocketSender(message, "john-doe");
      expect(hasAnotherUser).toBeFalsy();
      done();
    });

    it("should return user with username 'john-doe'", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      const user = getRocketSender(message);
      expect(user).toHaveProperty("_id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("username");
      expect(user.username).toBe("john-doe");
      done();
    });

    it("should return user with username 'mary'", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.msg = "!missao @mary";
      message.mentions[0].name = "Mary";
      message.mentions[0].username = "mary";
      const user = getRocketSender(message);
      expect(user).toHaveProperty("_id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("username");
      expect(user.username).toBe("mary");
      done();
    });

    it("should return first user to message with more than one user", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionAccepted)
      );
      message.msg = "!missao @john-doe @mary";
      message.mentions[1] = JSON.parse(JSON.stringify(message.mentions[0]));
      message.mentions[1].name = "Mary";
      message.mentions[1].username = "mary";
      const user = getRocketSender(message);
      expect(user).toHaveProperty("_id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("username");
      expect(user.username).toBe("john-doe");
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
    it("should return false to empty reaction", done => {
      const isAccepted = isAcceptedAnswer({
        reaction: null
      });
      expect(isAccepted).toBeFalsy();
      done();
    });

    it("should return false to another reaction", done => {
      const isAccepted = isAcceptedAnswer({
        reaction: "atena"
      });
      expect(isAccepted).toBeFalsy();
      done();
    });

    it("should return false to refused reaction", done => {
      const isAccepted = isAcceptedAnswer({
        reaction: "refused"
      });
      expect(isAccepted).toBeFalsy();
      done();
    });

    it("should return true to accepted reaction", done => {
      const isAccepted = isAcceptedAnswer({
        reaction: "accepted"
      });
      expect(isAccepted).toBeTruthy();
      done();
    });
  });

  describe("isRefusedAnswer", () => {
    it("should return false to empty reaction", done => {
      const isRefused = isRefusedAnswer({
        reaction: null
      });
      expect(isRefused).toBeFalsy();
      done();
    });

    it("should return false to another reaction", done => {
      const isRefused = isRefusedAnswer({
        reaction: "atena"
      });
      expect(isRefused).toBeFalsy();
      done();
    });

    it("should return false to accepted reaction", done => {
      const isRefused = isRefusedAnswer({
        reaction: "accepted"
      });
      expect(isRefused).toBeFalsy();
      done();
    });

    it("should return true to refused reaction", done => {
      const isRefused = isRefusedAnswer({
        reaction: "refused"
      });
      expect(isRefused).toBeTruthy();
      done();
    });
  });

  describe("convertToMissionData", () => {
    it("should return to empty researchHash", done => {
      const message = JSON.parse(
        JSON.stringify(messageWithAnswerMissionRefused)
      );
      message.researchHash = null;
      const data = convertToMissionData(message);
      expect(data).toBeFalsy();
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
