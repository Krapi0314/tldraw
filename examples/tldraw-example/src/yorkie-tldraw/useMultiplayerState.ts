import { TDBinding, TDShape, TDUser, TldrawApp } from "@tldraw/tldraw";
import { useCallback, useEffect, useState } from "react";
import { rotateShapes } from "../../../../packages/tldraw/src/state/commands";
//import { Room } from "@y-presence/client";
// import {
//   awareness,
//   client,
//   doc,
//   provider,
//   undoManager,
//   yBindings,
//   yShapes
// } from "./store";
import type { TldrawPresence } from "./types";
import * as yorkie from "./yorkie-js-sdk"

//const room = new Room(awareness);

/** Client **/
// Creating a client
const client = new yorkie.Client('http://wbj-vpc-alb-private-152462774.ap-northeast-2.elb.amazonaws.com:8090');

/** Document **/
// Creating a document
const doc = new yorkie.Document<YorkieType>('testt2');

/** Doc Type */
export type YorkieType = {
  shapes: Record<string, TDShape>
  bindings: Record<string, TDBinding>
}

export function useMultiplayerState(roomId: string) {

  const [app, setApp] = useState<TldrawApp>();
  const [loading, setLoading] = useState(true);

  const onMount = useCallback(
    (app: TldrawApp) => {
      const userName = localStorage.getItem("userName")

      app.loadRoom(roomId, userName === null ? "익명" : userName);
      app.pause();
      setApp(app);
    },
    [roomId]
  );

  const onChangePage = useCallback(
    (
      app: TldrawApp,
      shapes: Record<string, TDShape | undefined>,
      bindings: Record<string, TDBinding | undefined>
    ) => {
      //undoManager.stopCapturing();
      doc.update((root) => {
        Object.entries(shapes).forEach(([id, shape]) => {
          if (!shape) {
            delete root.shapes[id];
          } else {
            root.shapes[id] = shape;
          }
        })
        Object.entries(bindings).forEach(([id, binding]) => {
          if (!binding) {
            delete root.bindings[id];
          } else {
            root.bindings[id] = binding;
          }
        })
      })
    },
    []
  );

  const onUndo = useCallback(() => {
    //undoManager.undo();
  }, []);

  const onRedo = useCallback(() => {
    //undoManager.redo();
  }, []);

  /**
   * Callback to update user's (self) presence
   */
  const onChangePresence = useCallback((app: TldrawApp, user: TDUser) => {
    if (!app.room) return;
    //room.setPresence<TldrawPresence>({ id: app.room.userId, tdUser: user });
  }, []);

  /**
   * Update app users whenever there is a change in the room users
   */
  // useEffect(() => {
  //   if (!app || !room) return;

  //   const unsubOthers = room.subscribe<TldrawPresence>("others", (users) => {
  //     if (!app.room) return;

  //     const ids = users
  //       .filter((user) => user.presence)
  //       .map((user) => user.presence!.tdUser.id);

  //     Object.values(app.room.users).forEach((user) => {
  //       if (user && !ids.includes(user.id) && user.id !== app.room?.userId) {
  //         app.removeUser(user.id);
  //       }
  //     });

  //     app.updateUsers(
  //       users
  //         .filter((user) => user.presence)
  //         .map((other) => other.presence!.tdUser)
  //         .filter(Boolean)
  //     );
  //   });

  //   return () => {
  //     unsubOthers();
  //   };
  // }, [app]);

  useEffect(() => {
    if (!app) return;

    function handleDisconnect() {
      //provider.disconnect();
    }

    window.addEventListener("beforeunload", handleDisconnect);

    function handleChanges() {
      let root = doc.getRoot();

      let shapeRecord: Record<string, TDShape> = JSON.parse(JSON.parse(JSON.stringify(root.shapes)))
      let bindingRecord: Record<string, TDBinding> = JSON.parse(JSON.parse(JSON.stringify(root.bindings)))

      app?.replacePageContent(
        shapeRecord,
        bindingRecord,
        {}
      );
    }

    async function setup() {
      console.log("setup");
      try {
        // active yorkie client
        await client.activate();

        // attach yorkie document to client
        await client.attach(doc);

        doc.update((root) => {
          if (!root.shapes) {
            root.shapes = {};
          }
          if (!root.bindings) {
            root.bindings = {};
          }
        }, 'create points if not exists');

        doc.subscribe((event) => {
          handleChanges();
        })

        //yShapes.observeDeep(handleChanges);

        await client.sync();
        handleChanges();
        setLoading(false);

      }
      catch (e) {
        console.error(e);
      }
    }

    setup();

    return () => {
      window.removeEventListener("beforeunload", handleDisconnect);
      //yShapes.unobserveDeep(handleChanges);
    };
  }, [app]);

  return {
    onMount,
    onChangePage,
    onUndo,
    onRedo,
    loading,
    onChangePresence
  };
}