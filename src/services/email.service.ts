import Container from 'typedi';
import { EMAIL_CHECK_INTERVAL } from '@/config';
import { ProfileService } from './profiles.service';
import { imapConfig } from '@/config/email';
import { simpleParser } from 'mailparser';

const Imap = require('imap');
const { Service } = require('typedi');

@Service()
class EmailFetcherService {
  private imap;
  public profile = Container.get(ProfileService);

  constructor() {
    this.imap = new Imap(imapConfig);
    this.setupListeners();
  }

  setupListeners(): void {
    this.imap.once('ready', this.onImapReady.bind(this));
    this.imap.once('error', this.onImapError.bind(this));
    this.imap.once('end', this.onImapEnd.bind(this));
    this.imap.connect();
  }

  private onImapReady(): void {
    console.log('IMAP Ready', EMAIL_CHECK_INTERVAL);
    this.checkForNewEmails();
    setInterval(this.checkForNewEmails.bind(this), parseInt(EMAIL_CHECK_INTERVAL));
  }

  private onImapError(err: Error): void {
    console.error('IMAP Error:', err);
  }

  private onImapEnd(): void {
    console.log('IMAP Connection ended');
  }

  private openInbox(cb: (err: Error, mailbox) => void) {
    this.imap.openBox('INBOX', false, cb);
  }

  private async checkForNewEmails() {
    this.openInbox(async (err, box) => {
      if (err) {
        console.error('Open Inbox Error:', err);
        return;
      }

      this.imap.search(['UNSEEN'], async (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
          console.log('No unseen emails.');
          return;
        }

        const fetch = this.imap.fetch(results, { bodies: '', markSeen: true, struct: true });
        fetch.on('message', (msg, seqno) => {
          msg.on('body', (stream, info) => {
            simpleParser(stream, async (err, mail) => {
              if (err) {
                console.error(err);
                return;
              }

              const profile = await this.profile.findProfileByAccountEmail(mail.from.value[0].address);

              if (profile) {
                const result = await this.profile.findRelevantAccountAndAttachment(profile, mail);

                if (result) {
                  const csvContent = Buffer.from(result.attachment.content, 'base64');
                  const parsedData = this.profile.parseCsvWithSchema(csvContent, profile.SchemaConfig);

                  const priceListItems = parsedData.map(item => ({
                    customId: `${item.MCC}${item.MNC}_${result.account._id}`,
                    country: item.country || '_',
                    MCC: item.MCC || '_',
                    MNC: item.MNC || '_',
                    price: item.price,
                    currency: item.currency,
                  }));

                  await this.profile
                    .updatePriceList(result.account._id, priceListItems)
                    .then(() => {
                      console.log('Price list updated successfully.');
                    })
                    .catch(err => {
                      console.error('Failed to update price list:', err);
                    });
                } else {
                  console.log('No relevant account or attachment found for this email.');
                }
              }
            });
          });
        });
        fetch.once('error', err => console.log('Fetch error:', err));
        fetch.once('end', () => console.log('Done fetching all messages!'));
      });
    });
  }
}

export default EmailFetcherService;
