const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

const imapConfig = {
  user: 'mokaid83@gmail.com',
  password: 'wmhi fdxy xioc usky',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  debug: console.log,
  tlsOptions: { rejectUnauthorized: false },
  keepalive: true,
};

const imap = new Imap(imapConfig);

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

function checkForNewEmails() {
  openInbox((err, box) => {
    console.log(box);
    if (err) throw err;
    imap.search(['UNSEEN'], (err, results) => {
      console.log(results);
      if (err) throw err;
      if (results.length === 0) {
        console.log('No unseen emails.');
        return;
      }
      const f = imap.fetch(results, { bodies: '', markSeen: true, struct: true });
      f.on('message', (msg, seqno) => {
        msg.on('body', (stream, info) => {
          // Type 'info' more specifically if possible
          simpleParser(stream, async (err, mail) => {
            if (err) {
              console.error(err);
              return;
            }
            if (mail.from.value[0].address === 'fouadov@hotmail.com') {
              // Check if the email is from the specific sender
              mail.attachments.forEach(attachment => {
                if (attachment.filename === 'file3.csv') {
                  // Check for the specific file
                  console.log(`Saving attachment: ${attachment.filename}`);
                  fs.writeFileSync(path.join(__dirname, attachment.filename), attachment.content);
                }
              });
            }
          });
        });
      });
      f.once('error', err => {
        console.log('Fetch error: ' + err);
      });
      f.once('end', () => {
        console.log('Done fetching all messages!');
      });
    });
  });
}

imap.once('ready', () => {
  checkForNewEmails();
  setInterval(checkForNewEmails, 1 * 60 * 1000); // Check every minute
});

imap.once('error', err => {
  console.error(err);
});

imap.once('end', () => {
  console.log('Connection ended');
});

imap.connect();
