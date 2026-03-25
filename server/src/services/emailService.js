class EmailService {
  async send({ to, subject, body }) {
    const payload = {
      to,
      subject,
      body,
      sentAt: new Date().toISOString(),
    };

    // Mock notification service; replace with provider SDK in production.
    console.log('[MockEmailService]', JSON.stringify(payload));
    return { success: true };
  }

  async sendRegistrationEmail(user) {
    return this.send({
      to: user.email,
      subject: 'Welcome to Customized T-Shirt Printing',
      body: `Hello ${user.name}, your account has been created successfully.`,
    });
  }

  async sendLoginEmail(user) {
    return this.send({
      to: user.email,
      subject: 'New Login Alert',
      body: `Hi ${user.name}, your account was accessed on ${new Date().toUTCString()}.`,
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    return this.send({
      to: user.email,
      subject: 'Password Reset Request',
      body: `Use this token to reset your password: ${resetToken}`,
    });
  }

  async sendOrderConfirmationEmail(user, order) {
    return this.send({
      to: user.email,
      subject: `Order Confirmation #${order._id}`,
      body: `Your order has been placed successfully with total ${order.total}.`,
    });
  }

  async sendPromotionalAlert(users, message) {
    const notifications = users.map((user) =>
      this.send({
        to: user.email,
        subject: 'Promotional Alert',
        body: message,
      })
    );

    await Promise.all(notifications);
  }
}

export default new EmailService();
