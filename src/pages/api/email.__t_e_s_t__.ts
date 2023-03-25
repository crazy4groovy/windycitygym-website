// import { _post } from "./email" << --- this not working ?!?! OK, we'll improvise....

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

interface PostBody {
  from: string;
  name: string;
  text: string;
  answer?: string;
}

const makeMessage = (
  from: string,
  name: string,
  text: string,
  to = process.env.GMAIL_TO
) => ({
  from: `"${from}" <${process.env.GMAIL_ACCOUNT}>`,
  to,
  subject: `Website Email from: ${name}`,
  text,
  html: `<p>${text.replaceAll(/\r?\n/g, "<br>")}</p>`,
});

const poolConfig = `smtps://${process.env.GMAIL_ACCOUNT}:${process.env.GMAIL_APP_PW}@smtp.gmail.com/`;

// Exported for testing purposes
const _post = async ({ from, name, text }: PostBody): Promise<void> => {
  const transporter = nodemailer.createTransport(poolConfig);
  await transporter.sendMail(makeMessage(from, name, text));
};

const textTest = `Hi
nodemailer
multi-line
test body`;

_post({
  from: "spam2steve@gmail.com",
  name: "NODEMAILER TEST name",
  text: textTest,
}).then(() => {
  console.log("COMPLETED LIVE TEST; CHECK SPAM2STEVE@GMAIL.COM");
});
