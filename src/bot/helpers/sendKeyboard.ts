export async function sendKeyboard(
  chatId: number,
  text: string,
  token: string,
  buttons: { text: string; callback_data: string }[],
) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [
          buttons.map((b) => ({
            text: b.text,
            callback_data: b.callback_data,
          })),
        ],
      },
    }),
  });
}