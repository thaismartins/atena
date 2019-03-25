import { _throw } from "../helpers";
import batch from "batchflow";

import { getMessagesByRoomId } from "../rocket/api";
import interactionController from "./interaction";

// TODO: buscar dados por roomId
// TODO: fazer for para salvar interação
// TODO: fazer split de reaction

const saveByRoomId = async roomId => {
  if (!roomId) {
    _throw("Error no roomId was sended");
  }

  try {
    const room = await getMessagesByRoomId(roomId);

    if (room.messages.length) {
      batch(room.messages)
        .sequential()
        .each(async (i, item, next) => {
          item.origin = "rocket";
          let reactions;
          if (item.reactions) {
            reactions = item.reactions;
            item.reactions = null;
          }

          if (item.msg == "" && item.attachments.length === 0) {
            console.log("Tem anexos sem mensagem...");
            item.msg = "attachment";
          }

          await interactionController.save(item);

          if (reactions !== undefined) {
            reactions[":thumbsup:"] = { usernames: ["thais.martins"] };
            // console.log("reactions", reactions);
            // let message = Object.assign(item);
            for (let reaction in reactions) {
              let users = reactions[reaction].usernames;
              users.push("thais.martins");
              for (let user of users) {
                let interaction = Object.assign(item);
                interaction.reactions = {};
                interaction.reactions[reaction] = {
                  usernames: [user]
                };

                const inte2 = await interactionController.save(interaction);
                console.log("inte2", inte2);
                console.log("--------------------------------");
              }
            }
          }
          next();
        })
        .end(results => {
          console.log("results ", results);
        });
    }
  } catch (error) {
    _throw("Error on saveByRoomId in interactionHistory");
  }
};

const exportFunctions = {
  saveByRoomId
};

export default exportFunctions;
