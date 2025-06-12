module.exports = {
  parsePlaceholders(str, data) {
    // data: { user, username, server, membercount, date, account_age }
    return str
      .replace(/{user}/g, data.user)
      .replace(/{username}/g, data.username)
      .replace(/{server}/g, data.server)
      .replace(/{membercount}/g, data.membercount)
      .replace(/{date}/g, data.date)
      .replace(/{account_age}/g, data.account_age);
  }
};
