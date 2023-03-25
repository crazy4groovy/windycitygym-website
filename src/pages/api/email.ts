import type { APIRoute } from "astro";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import nodemailer from "nodemailer";

interface PostBody {
  from: string;
  name: string;
  text: string;
  answer?: string;
}

function makeResponse200(message?: string) {
  if (message) {
    return new Response(JSON.stringify({ message }), { status: 200 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

const makeMessage = (
  from: string,
  name: string,
  text: string,
  to = import.meta.env.GMAIL_TO
) => ({
  from: `"${from}" <${import.meta.env.GMAIL_ACCOUNT}>`,
  to,
  subject: `Website Email from: ${name}`,
  text,
  html: `<p>${text.replaceAll(/\r?\n/g, "<br>")}</p>`,
});

const poolConfig = `smtps://${import.meta.env.GMAIL_ACCOUNT}:${
  import.meta.env.GMAIL_APP_PW
}@smtp.gmail.com/`;

// Exported for testing purposes.. supposedly
export const _post = async ({
  from,
  name,
  text,
}: PostBody): Promise<SMTPTransport.SentMessageInfo> => {
  const transporter = nodemailer.createTransport(poolConfig);
  return transporter.sendMail(makeMessage(from, name, text));
};

export const post: APIRoute = async function post({ request }) {
  try {
    let doSend = request.headers?.get("Content-Type") === "application/json";
    if (!doSend) {
      return makeResponse200("json");
    }

    const body = (await request.json()) as PostBody;

    // validate honeypot
    // Challenge question: "Today's Day of Month Is..."
    const { answer } = body;
    // Note: buffer by +/-1 day to handle diff time zones
    doSend = Math.abs(new Date().getDate() - Number(answer)) <= 1;
    if (!doSend) {
      return makeResponse200(answer);
    }

    let { from, name, text } = body;
    doSend = Boolean(from && name && text);
    if (!doSend) {
      return makeResponse200("body");
    }

    [from, name, text] = [from, name, text].map(
      (t, i) => t.slice(0, 50 + 200 * i) // do some VERY basic input sanitization
    );

    await _post({ from, name, text }).catch((err) => {
      // TODO: needs better error handling!
      console.error({ poolConfig, err: err.message });
    });

    return makeResponse200(`${from} : ${name}`);
  } catch (err) {
    return makeResponse200();
  }
};
