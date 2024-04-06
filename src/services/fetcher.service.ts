import Container from 'typedi';
import { Profile } from '@/interfaces/profiles.interface';
import { ProfileService } from './profiles.service';
import { simpleParser } from 'mailparser';

const Imap = require('imap');

const fs = require('fs');
const path = require('path');

const { Service } = require('typedi');

@Service()
class EmailFetcherService {
  private imap;
  public profile = Container.get(ProfileService);

  constructor() {
    const imapConfig = {
      user: 'mokaid83@gmail.com',
      password: 'wmhi fdxy xioc usky',
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    };

    this.imap = new Imap(imapConfig);
    this.setupListeners();
  }

  setupListeners() {
    this.imap.once('ready', () => {
      console.log('IMAP Ready');
      this.checkForNewEmails();
      // Set interval to check for emails periodically
      setInterval(this.checkForNewEmails.bind(this), 5000); // Example: every 5 minutes
    });

    this.imap.once('error', err => console.error('IMAP Error:', err));
    this.imap.once('end', () => console.log('IMAP Connection ended'));

    this.imap.connect();
  }

  private openInbox(cb: (err: Error, mailbox) => void) {
    this.imap.openBox('INBOX', false, cb);
  }

  private async checkForNewEmails() {
    this.openInbox((err, box) => {
      if (err) {
        console.error('Open Inbox Error:', err);
        return;
      }

      this.imap.search(['UNSEEN'], (err, results) => {
        console.log(results);
        if (err) throw err;
        if (results.length === 0) {
          console.log('No unseen emails.');
          return;
        }

        const f = this.imap.fetch(results, { bodies: '', markSeen: false, struct: true });
        f.on('message', (msg, seqno) => {
          msg.on('body', (stream, info) => {
            // Type 'info' more specifically if possible
            simpleParser(stream, async (err, mail) => {
              if (err) {
                console.error(err);
                return;
              }

              const profile = await this.profile.findProfileByAccountEmail(mail.from.value[0].address);

              console.log(JSON.stringify(profile), mail);

              // if (mail.from.value[0].address === 'fouadov@hotmail.com') {
              //   // Check if the email is from the specific sender
              //   mail.attachments.forEach(attachment => {
              //     if (attachment.filename === 'file3.csv') {
              //       // Check for the specific file
              //       console.log(`Saving attachment: ${attachment.filename}`);
              //       fs.writeFileSync(path.join(__dirname, attachment.filename), attachment.content);
              //     }
              //   });
              // }
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
}

export default EmailFetcherService;
