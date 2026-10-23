// Camera gestures belong only to the world canvas. Buttons, panels and the
// walking joystick keep their own pointers, including during two-finger play.
export function installCameraControls(game, canvas) {
  let drag = null;
  const document = canvas.ownerDocument;
  const blocked = () => (game.inCar && game.cameraMode === 2) || game.paused || game.transition ||
    game.ui.isPhoneOpen();

  const release = () => {
    const id = drag?.pointerId;
    drag = null;
    if (id !== undefined && canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
  };
  game.releaseCameraDrag = release;

  canvas.addEventListener('pointerdown', event => {
    const rightLook = event.pointerType === 'mouse' && event.button === 2;
    if (event.target !== canvas || drag || (event.button !== 0 && !rightLook) || blocked()) return;
    if (game.weapon && !game.inCar && !game.aircraft?.active && !rightLook) {
      game.shoot();
      return;
    }
    game.cameraRecentering = false;
    drag = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      rightLook,
      x: event.clientX,
      y: event.clientY,
    };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    // Opening a menu or starting a transition must not leave a gesture active.
    if (blocked()) {
      release();
      return;
    }
    // Positive game yaw looks left in walking, chase and cabin views. Touch
    // swipes should look in the finger's direction; keep desktop mouse orbit
    // unchanged for left-drag. Right-drag is direct look/aim, so moving
    // the mouse right looks right, even while a weapon is equipped.
    const direction = drag.pointerType === 'touch' || drag.rightLook ? -1 : 1;
    game.cameraYaw += (event.clientX - drag.x) * .004 * direction;
    if (drag.rightLook && game.weapon && !game.inCar && !game.aircraft?.active) {
      game.playerYaw = game.cameraYaw;
      if (game.person?.root) game.person.root.rotation.y = game.playerYaw;
    }
    if (game.inCar && game.cameraMode === 1) {
      game.cameraYaw = Math.max(-2.75, Math.min(2.75, game.cameraYaw));
      game.cameraPitch = Math.max(-.95, Math.min(.95,
        (game.cameraPitch ?? 0) + (event.clientY - drag.y) * .003));
    }
    drag.x = event.clientX;
    drag.y = event.clientY;
    game.manualCameraTime = game.time;
  });

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => {
      if (event.pointerId === drag?.pointerId) release();
    });
  }
  canvas.addEventListener('contextmenu', event => event.preventDefault());
}
