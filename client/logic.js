const eventSource = new EventSource("./events");
const messageTemplate = document.getElementById("message-template");
let messageCount = 0;
let accessoryInformation = {};

/**
 *
 * @param sync
 * @param toFrontend
 */
function getMessageDiv(sync, toFrontend) {
  messageCount++;
  if (messageCount > 50) {
    /* TODO */
  }

  const message = document.importNode(messageTemplate.content, true);

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

  message.querySelector(
    ".t-ts",
  ).innerHTML = `${hours}:${minutes}:${seconds}:${milliseconds}`;
  message.querySelector(".t-payload").innerHTML = JSON.stringify(
    sync.payload.eventPayload,
  );
  message.querySelector(".t-type").innerHTML = sync.payload.eventName;
  return message;
}

/**
 *
 * @param devices
 */
function generateDeviceCards(devices) {
  const template = document.getElementById("card-col-template");
  const target = document.getElementById("appendable-card");
  const placeholder = document.getElementById("placeholder-card");
  placeholder.style.display = "none";

  for (const key of Object.keys(devices)) {
    const card = document.importNode(template.content, true);
    const device = devices[key];

    card
      .querySelector(".card")
      .classList.add(`t-${key}`, `t-${device.notificationName}`);
    card.querySelector(".t-name").innerHTML = device.displayName;
    card.querySelector(".t-pincode").innerHTML = device.pincode;

    if (device.icon)
      card
        .querySelector(".t-icon")
        .setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          `#${device.icon}`,
        );

    const badge = card.querySelector(".t-badge");
    if (device.state) {
      switch (device.state) {
        case "created":
          badge.classList.add("text-bg-dark");
          badge.innerHTML = "Created";
          break;
        case "connected":
          badge.classList.add("text-bg-green");
          badge.innerHTML = "Connected";
          break;
        case "error":
          badge.classList.add("text-bg-danger");
          badge.innerHTML = "Error";
          break;
        default:
          badge.classList.add("text-bg-secondary");
          badge.innerHTML = "Unknown";
          break;
      }
    } else {
      badge.classList.add("text-bg-secondary");
      badge.innerHTML = "Unknown";
    }

    const description = card.querySelector(".t-description");
    if (devices.description) {
      description.innerHTML = device.description;
    } else {
      description.remove();
    }
    target.appendChild(card);
  }
}

eventSource.addEventListener("message", (message) => {
  const sync = JSON.parse(message.data);
  const dataDiv = document.getElementById("appendable-messages");
  switch (sync.type) {
    case "accessoryInformation":
      accessoryInformation = sync.data;
      console.log(accessoryInformation);
      generateDeviceCards(accessoryInformation);
      break;

    case "toFrontend":
      dataDiv.prepend(getMessageDiv(sync.data, true));
      break;

    case "fromFrontend":
      dataDiv.prepend(getMessageDiv(sync.data, false));
      break;

    default:
      break;
  }
});
eventSource.onerror = (error) => {
  console.error("Error:", error);
};
