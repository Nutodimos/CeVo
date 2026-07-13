"use server";

import { sendEmail } from "@/lib/email";

export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const organization = formData.get("organization") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !organization || !message) {
    return { success: false, error: "All fields are required" };
  }

  const htmlContent = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Organization:</strong> ${organization}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  const result = await sendEmail({
    to: "oluwasomidotundavid13@gmail.com",
    subject: `New CeVo Sales Inquiry from ${name} (${organization})`,
    html: htmlContent,
  });

  if (!result.success) {
    return { success: false, error: "Failed to send email. Please try again later." };
  }

  return { success: true };
}
