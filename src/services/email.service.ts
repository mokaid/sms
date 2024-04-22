import Container from 'typedi';
import { EMAIL_CHECK_INTERVAL } from '@/config';
import { IAccount } from '@/interfaces/accounts.interface';
import Imap from 'imap';
import { ProfileService } from './profiles.service';
import { Service } from 'typedi';
import { imapConfig } from '@/config/email';
import { simpleParser } from 'mailparser';

@Service()
class EmailFetcherService {
  private imap: {
    once: (arg0: string, arg1: any) => void;
    connect: () => void;
    openBox: (arg0: string, arg1: boolean, arg2: (err: Error, mailbox: any) => void) => void;
    search: (arg0: string[], arg1: (err: any, results: any) => Promise<void>) => void;
    fetch: (arg0: any, arg1: { bodies: string; markSeen: boolean; struct: boolean }) => any;
  };
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
    this.openInbox(async err => {
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
        fetch.on('message', (msg: { on: (arg0: string, arg1: (stream: any, info: any) => void) => void }) => {
          msg.on('body', stream => {
            simpleParser(stream, async (err, mail) => {
              if (err) {
                console.error(err);
                return;
              }

              const profile = await this.profile.findProfileByAccountEmail(mail.from.value[0].address);

              if (profile) {
                const result = await this.profile.findRelevantAttachmentForAccount(profile.data?.accounts[0], mail);

                if (result) {
                  const csvContent = Buffer.from(result.attachment.content, 'base64');

                  const { deleteAllExisting } = profile.data.accounts[0].emailCoverageList;

                  const parsedData = this.profile.parseCsvWithSchema(csvContent, profile.data.SchemaConfig);

                  const priceListItems = parsedData.map(item => ({
                    country: item.country,
                    MCC: item.MCC,
                    MNC: item.MNC,
                    price: item.price,
                    currency: item.currency,
                  }));

                  await this.profile
                    .updatePriceList((result.account as IAccount & { _id: string })._id, priceListItems, deleteAllExisting)
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
