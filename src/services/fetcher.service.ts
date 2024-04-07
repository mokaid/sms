import Container from 'typedi';
import { FileFormat } from '@/enums/profiles.enums';
import { ProfileService } from './profiles.service';
import { simpleParser } from 'mailparser';
const xlsx = require('xlsx');
const Imap = require('imap');
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
      setInterval(this.checkForNewEmails.bind(this), 30000); // Adjust interval as needed
    });

    this.imap.once('error', err => console.error('IMAP Error:', err));
    this.imap.once('end', () => console.log('IMAP Connection ended'));

    this.imap.connect();
  }

  private openInbox(cb: (err: Error, mailbox) => void) {
    this.imap.openBox('INBOX', false, cb);
  }
  private async findRelevantAccountAndAttachment(profile: any, mail: any) {
    if (!mail.attachments || mail.attachments.length === 0) {
      console.log('Email has no attachments, skipping.');
      return null;
    }

    let foundAccount = null;
    let relevantAttachment = null;

    const emailSubject = mail.subject?.toLowerCase() || '';
    const emailText = mail.text?.toLowerCase() || '';

    // First, find any account that matches the username in the email's subject or body.
    // if (mail.subject || mail.text) {
    foundAccount = profile.Accounts.find(account => {
      const username = account.connection.userName.toLowerCase();
      return emailSubject.toLowerCase().includes(username) || emailText.toLowerCase().includes(username);
    });
    //}

    // If an account is found, look for a relevant attachment that includes the account's partialFileName.
    if (foundAccount) {
      relevantAttachment = mail.attachments.find(attachment => {
        const isRelevantFormat = [FileFormat.CSV, FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType);
        return isRelevantFormat && attachment.filename.toLowerCase().includes(foundAccount.emailCoverageList.partialFileName.toLowerCase());
      });

      // For Excel files, additionally check if any sheet name contains the account's username, if no attachment has been selected yet.
      if (!relevantAttachment) {
        relevantAttachment = mail.attachments.find(attachment => {
          if ([FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType)) {
            const workbook = xlsx.read(attachment.content, { type: 'buffer' });
            return workbook.SheetNames.some(sheetName => sheetName.toLowerCase().includes(foundAccount.connection.userName.toLowerCase()));
          }
          return false;
        });
      }
    }

    // If still no account was found through the subject or body, try finding an account through the attachment filenames or Excel sheet names.
    if (!foundAccount) {
      mail.attachments.forEach(attachment => {
        if (!foundAccount && [FileFormat.CSV, FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType)) {
          foundAccount = profile.Accounts.find(account => {
            const username = account.connection.userName.toLowerCase();
            const matchesFilename = attachment.filename.toLowerCase().includes(username);
            let matchesSheetName = false;
            if ([FileFormat.XLS, FileFormat.XLSX].includes(attachment.contentType)) {
              const workbook = xlsx.read(attachment.content, { type: 'buffer' });
              matchesSheetName = workbook.SheetNames.some(sheetName => sheetName.toLowerCase().includes(username));
            }
            return matchesFilename || matchesSheetName;
          });
          if (foundAccount) {
            relevantAttachment = attachment;
          }
        }
      });
    }

    if (foundAccount && relevantAttachment) {
      // console.log('Relevant account and attachment found:', foundAccount, relevantAttachment.filename);
      return { account: foundAccount, attachment: relevantAttachment };
    } else {
      // console.log('No relevant account or attachment found for this email.');
      return null;
    }
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
                const result = await this.findRelevantAccountAndAttachment(profile, mail);
                if (result) {
                  console.log('Relevant account and attachment found:', result);
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
