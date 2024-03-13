const eventSource = new EventSource("./events");

const cardTemplate = document.getElementById("card-col-template");

const deviceModalTemplate = document.getElementById("device-modal-template");
const deviceModal = document.getElementById("deviceModal");
const deviceModalTarget = document.getElementById("deviceModalTarget");

const messageTemplate = document.getElementById("message-template");
const dataDiv = document.getElementById("appendable-messages");

let messageCount = 0;
let currentModal = undefined;
let messages = [];
let accessoryInformation = {};

deviceModal.addEventListener("show.bs.modal", async (event) => {
  const modal = document.importNode(deviceModalTemplate.content, true);
  const attrib = event.relatedTarget.getAttribute("device-reference");
  const device = accessoryInformation[attrib];

  const hkQr = await composeHomekitQrCode(
    device.pincode.replace(/\D/g, ""),
    device.setupURI,
  );

  modal.querySelector(".t-hkcode").innerHTML = hkQr;
  modal.querySelector(".t-pincode").innerText = device.pincode;
  modal.querySelector(".t-username").innerText = device.username;
  modal.querySelector(".t-port").innerText = device.port;
  modal.querySelector(".t-uri").innerText = device.setupURI.replace(
    "X-HM://",
    "",
  );
  modal.querySelector(".t-device").innerText = attrib;
  modal.querySelector(".t-displayn").innerText = device.displayName;
  modal.querySelector(".t-handler").innerText = device.deviceHandlerName;
  modal.querySelector(".t-notification").innerText = device.notificationName;
  modal.querySelector(".t-description").innerText = device.description;
  modal.querySelector(".t-idmaterial").innerText =
    device.addIdentifyingMaterial;
  modal.querySelector(".t-category").innerText = device.category;
  if (device.state)
    modal.querySelector(".t-state").append(getStateBadge(device.state));

  modal.querySelector(".t-manufacturer").innerText = device.manufacturer;
  modal.querySelector(".t-model").innerText = device.model;
  modal.querySelector(".t-serial").innerText = device.serialNumber;
  modal.querySelector(".t-version").innerText = device.manufacturer;

  modal.querySelector(".t-docs").href = device.docsUrl;

  deviceModalTarget.append(modal);
  currentModal = attrib;
});
deviceModal.addEventListener("hidden.bs.modal", () => {
  deviceModalTarget.textContent = "";
  currentModal = undefined;
});

document.getElementById("ctaModal").addEventListener("hidden.bs.modal", () => {
  const cards = document.getElementById("appendable-card");
  cards.classList.add("intermitent");
  setTimeout(() => {
    cards.classList.remove("intermitent");
  }, 6000);
});

/**
 * Creates the HTML for messages from backend/frontent
 * @param {object} sync Message sent by backend
 */
function generateMessageListEl(sync) {
  messageCount++;
  if (messageCount > 50) {
    /* TODO */
  }
  messages.push(sync);

  const message = document.importNode(messageTemplate.content, true);

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

  message.querySelector(
    ".t-ts",
  ).innerText = `${hours}:${minutes}:${seconds}:${milliseconds}`;
  message.querySelector(".t-payload").innerText = JSON.stringify(
    sync.payload.eventPayload,
  );
  message.querySelector(".t-type").innerText = sync.payload.eventName;
  message
    .querySelector(".t-icon")
    .setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "xlink:href",
      sync.toFrontend ? "#boxarrowup" : "#boxarrowdown",
    );
  dataDiv.prepend(message);
}

/**
 * Generate the HTML for the device data state
 * @param {string} state Current state
 * @returns {HTMLSpanElement} Badge
 */
function getStateBadge(state) {
  const badge = document.createElement("span");
  badge.classList.add("badge");

  switch (state) {
    case "created":
      badge.classList.add("text-bg-primary");
      badge.innerText = "Created";
      break;
    case "paired":
      badge.classList.add("text-bg-info");
      badge.innerText = "Paired";
      break;
    case "advertised":
      badge.classList.add("text-bg-success");
      badge.innerText = "Advertised";
      break;
    case "unpaired":
      badge.classList.add("text-bg-warning");
      badge.innerText = "Unpaired";
      break;
    case "identify":
      badge.classList.add("text-bg-info");
      badge.innerText = "Pre-identify";
      break;
    default:
      badge.classList.add("text-bg-secondary");
      badge.innerText = "Unknown";
      break;
  }

  return badge;
}

/**
 * Generates the HTML for the device list
 * @param {object} devices List of devices from the backend
 */
function generateDeviceCards(devices) {
  const target = document.getElementById("appendable-card");
  const placeholder = document.getElementById("placeholder-card");
  placeholder.style.display = "none";

  target.innerHTML = "";

  for (const key of Object.keys(devices)) {
    const card = document.importNode(cardTemplate.content, true);
    const device = devices[key];

    card
      .querySelector(".card")
      .classList.add(`t-${key}`, `t-${device.notificationName}`);
    if (device.addIdentifyingMaterial) {
      card.querySelector(".t-name").innerText = device.displayName.slice(0, -5);
      card.querySelector(".t-mat").innerText = device.displayName.slice(-4);
    } else {
      card.querySelector(".t-name").innerText = device.displayName;
    }

    card.querySelector(".t-pincode").innerText = device.pincode;
    card.querySelector(".t-btn-info").setAttribute("device-reference", key);
    card.querySelector(".t-btn-docs").href = device.docsUrl;

    if (device.icon)
      card
        .querySelector(".t-icon")
        .setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          `#${device.icon}`,
        );

    if (device.state)
      card.querySelector(".t-badge").append(getStateBadge(device.state));

    const description = card.querySelector(".t-description");
    if (device.description) {
      description.innerText = device.description;
    } else {
      description.remove();
    }
    target.appendChild(card);
  }
}

eventSource.addEventListener("message", (message) => {
  const sync = JSON.parse(message.data);
  switch (sync.type) {
    case "accessoryInformation":
      accessoryInformation = sync.data;
      console.log(accessoryInformation);
      generateDeviceCards(accessoryInformation);
      break;

    case "toFrontend":
      if (sync.data.payload.eventPayload.type === "device-event") {
        let device = Object.keys(accessoryInformation).filter(
          (a) =>
            accessoryInformation[a].notificationName ===
            sync.data.payload.eventName,
        )[0];

        if (
          sync.data.payload.eventPayload.subtype === "identify" &&
          sync.data.payload.eventPayload.paired
        ) {
          let onCard = document.querySelector(`.t-${device}`);
          let onModal =
            currentModal === device
              ? document.querySelector(`#deviceModalTarget .modal-content`)
              : false;

          onCard.classList.add("identify-animation");
          if (onModal) onModal.classList.add("identify-animation");

          setTimeout(() => {
            onCard.classList.remove("identify-animation");
            if (onModal) onModal.classList.remove("identify-animation");
          }, 6000);
        } else {
          accessoryInformation[device].state =
            sync.data.payload.eventPayload.subtype;
          let onCard = document.querySelector(`.t-${device} .t-badge`);
          onCard.innerHTML = "";
          let onModal =
            currentModal === device
              ? document.querySelector(
                  `#deviceModalTarget .modal-content .modal-body .table .t-state`,
                )
              : false;
          const badge = getStateBadge(sync.data.payload.eventPayload.subtype);
          onCard.append(badge);
          if (onModal) {
            onModal.innerHTML = "";
            onModal.append(badge);
          }
        }
        break;
      }
      generateMessageListEl({ ...sync.data, toFrontend: true });
      break;

    case "fromFrontend":
      generateMessageListEl({ ...sync.data, toFrontend: false });
      break;

    default:
      break;
  }
});
eventSource.onerror = (error) => {
  console.error("Error:", error);
};

console.log(
  ` ⠖ %c by Fabrizz %c MMM-HomeKit `,
  "background-color: #555;color: #fff;margin: 0.4em 0em 0.4em 0.4em;padding: 5px 3px 5px 5px;border-radius: 7px 0 0 7px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;",
  "background-color: #bc81e0;background-image: linear-gradient(90deg, #FFE780, #FA9012);color: #000;margin: 0.4em 0.4em 0.4em 0em;padding: 5px 5px 5px 3px;border-radius: 0 7px 7px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)",
);

/**
 * Generate Homekit QR label
 * https://github.com/SimonGolms/homekit-code/blob/master/src/commands/qrcode
 * + Changed styling, qrcode
 * @param {string} pairingCode HK pairing code
 * @param {string} setupUri HK setup URI
 * @returns {string} HK qrcode SVG
 */
const composeHomekitQrCode = async (pairingCode, setupUri) => {
  // eslint-disable-next-line no-undef
  const code = await QRCode.toString(setupUri, {
    errorCorrectionLevel: "quartile",
    margin: 0,
    type: "svg",
    version: 2,
  });

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg viewBox="0 0 400 540" xmlns="http://www.w3.org/2000/svg">
  <title>HomeKit QR Code</title>
  <defs>
    <symbol id="homekit" viewBox="0 0 130 120"><path d="m128.28 49.26-14.16-11.3v-20c0-1.46-.57-1.9-1.6-1.9h-8.94c-1.2 0-1.93.24-1.93 1.9v10L67.81 1.3a4.22 4.22 0 0 0-6.09 0L1.31 49.26c-2.13 1.67-1.53 4.1.83 4.1h11.14v61.1c0 2.77.83 4.34 2.6 5.04a7 7 0 0 0 2.72.5h92.43a7.1 7.1 0 0 0 2.72-.5c1.77-.7 2.6-2.27 2.6-5.03V53.33h11.2c2.26 0 2.86-2.4.73-4.07ZM20.66 48.1a8.45 8.45 0 0 1 3.32-6.97c1.7-1.37 37.24-29.03 38.24-29.83a4.42 4.42 0 0 1 2.66-1.14c1 .07 1.95.47 2.7 1.14l38.2 30a8.43 8.43 0 0 1 3.32 6.96v58.9a4.25 4.25 0 0 1-4.72 4.77H25.05a4.2 4.2 0 0 1-4.39-4.77V48.1Z" fill="#000"/><path d="M37.12 99.03H92.4a3.12 3.12 0 0 0 3.32-3.56v-42.4a5.48 5.48 0 0 0-2.2-5L66.95 26.82c-.58-.5-1.3-.78-2.06-.8-.75.03-1.46.31-2.03.8l-26.6 21.23a5.46 5.46 0 0 0-2.2 5v42.4a3.14 3.14 0 0 0 3.07 3.57Zm4.29-43.17A4.08 4.08 0 0 1 42.97 52l19.95-15.94a2.72 2.72 0 0 1 1.7-.66c.63.02 1.24.25 1.72.66.53.47 19.05 15.1 19.95 15.94a4.07 4.07 0 0 1 1.56 3.86V88.2a2.47 2.47 0 0 1-2.69 2.83H44.1a2.45 2.45 0 0 1-2.7-2.83V55.86Z" fill="#000"/><path d="M53.54 80.67h22.44c1 0 1.73-.34 1.73-1.8V60.73a3.34 3.34 0 0 0-1.23-2.67L65.91 50a1.73 1.73 0 0 0-2.3 0l-10.57 8.13a3.33 3.33 0 0 0-1.23 2.67v18.13c0 1.4.73 1.74 1.73 1.74Zm5.92-17.1a1.3 1.3 0 0 1 .53-1.1l4.3-3.34a.8.8 0 0 1 .96 0s4.12 3.33 4.28 3.33a1.3 1.3 0 0 1 .54 1.1v8.57c0 .6-.3.73-.74.73H60.2c-.4 0-.73 0-.73-.73v-8.57Z"/></symbol>
    <symbol id="0" viewBox="0 0 34 48"><path d="M17 48c11 0 17-9 17-24S28 0 17 0 0 9 0 24s6 24 17 24ZM7 24C7 12 10 6 17 6c4 0 7 3 9 8L7 28v-4Zm10 18c-4 0-7-2-9-8l19-14v4c0 12-3 18-10 18Z"/></symbol>
    <symbol id="1" viewBox="0 0 34 48"><path d="M34 48v-6H21V0h-7L0 9v7l13-9h1v35H0v6h34Z"/></symbol>
    <symbol id="2" viewBox="0 0 34 48"><path d="M0 14.4684V14.664H7.02096V14.4684C7.02096 9.222 10.7987 5.73523 16.501 5.73523C22.1677 5.73523 25.8742 8.86354 25.8742 13.6864C25.8742 17.2383 24.2348 19.7149 17.5702 26.3299L0.356394 43.3401V48H34V42.0692H10.7631V41.5153L22.239 30.3381C30.6143 22.3218 33.1803 18.2811 33.1803 13.3279C33.1803 5.40937 26.5157 0 16.7149 0C6.91405 0 0 5.99593 0 14.4684Z"/></symbol>
    <symbol id="3" viewBox="0 0 34 48"><path d="M11 26h6c6 0 10 3 10 8s-4 8-10 8-10-3-10-7H0c0 8 7 13 17 13s17-6 17-14c0-6-4-10-10-11 5-1 8-5 8-11 0-7-6-12-15-12C7 0 1 5 1 13h6c1-5 4-7 10-7 5 0 8 2 8 7s-3 8-9 8h-5v5Z"/></symbol>
    <symbol id="4" viewBox="0 0 34 48"><path d="M21 48h6V38h7v-6h-7V19h-6v13H7L22 0h-7L0 33v5h21v10Z"/></symbol>
    <symbol id="5" viewBox="0 0 34 48"><path d="M17 48c10 0 17-7 17-16s-6-16-16-16c-4 0-8 2-10 4L9 6h22V0H3L1 27h7c1-3 5-5 9-5 6 0 10 4 10 10s-4 10-10 10c-5 0-10-3-10-8H0c0 8 7 14 17 14Z"/></symbol>
    <symbol id="6" viewBox="0 0 34 48"><path d="M34 32c0-9-6-15-15-15-3 0-6 1-8 3l1-3L25 0h-8L7 14c-5 7-7 12-7 18 0 9 7 16 17 16s17-7 17-16ZM17 42c-6 0-10-4-10-10s4-10 10-10 10 4 10 10-4 10-10 10Z"/></symbol>
    <symbol id="7" viewBox="0 0 34 48"><path d="M4 48h8L34 6V0H0v6h27L4 48Z"/></symbol>
    <symbol id="8" viewBox="0 0 34 48"><path d="M17 48c10 0 17-5 17-13 0-6-4-11-10-12v-1c5-1 8-5 8-10 0-7-6-12-15-12S2 5 2 12c0 5 3 9 8 10v1C4 24 0 29 0 35c0 8 7 13 17 13Zm0-28c-5 0-9-3-9-7 0-5 4-8 9-8s9 3 9 8c0 4-4 7-9 7Zm0 23c-6 0-10-4-10-9s4-8 10-8 10 3 10 8-4 9-10 9Z"/></symbol>
    <symbol id="9" viewBox="0 0 34 48"><path d="M0 16c0 9 6 15 15 15 3 0 6-1 8-3l-1 3L9 48h8l10-14c5-7 7-12 7-18 0-9-7-16-17-16S0 7 0 16ZM17 6c6 0 10 4 10 10s-4 10-10 10S7 22 7 16 11 6 17 6Z"/></symbol>
    <symbol id="qrCode" ${code.slice(5, -7)}</symbol>
  </defs>
  <rect fill="#000000" height="540" rx="40" width="400"/>
  <rect fill="#ffffff" height="530" rx="35" width="390" x="5" y="5"/>
  <use href="#homekit" height="120" width="130" x="24" y="30"/>
  <use href="#${pairingCode.charAt(0)}" height="48" width="34" x="174" y="30"/>
  <use href="#${pairingCode.charAt(1)}" height="48" width="34" x="228" y="30"/>
  <use href="#${pairingCode.charAt(2)}" height="48" width="34" x="282" y="30"/>
  <use href="#${pairingCode.charAt(3)}" height="48" width="34" x="336" y="30"/>
  <use href="#${pairingCode.charAt(4)}" height="48" width="34" x="174" y="102"/>
  <use href="#${pairingCode.charAt(5)}" height="48" width="34" x="228" y="102"/>
  <use href="#${pairingCode.charAt(6)}" height="48" width="34" x="282" y="102"/>
  <use href="#${pairingCode.charAt(7)}" height="48" width="34" x="336" y="102"/>
  <use href="#qrCode" height="340" width="340" x="30" y="175"/>
</svg>`;
};
