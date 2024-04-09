import Imap from 'imap';
import { imapConfig } from '@/config/email';

class EmailService {
  private imap: Imap;

  constructor() {
    this.imap = new Imap(imapConfig);
  }

  setupListeners(onNewEmail) {
    this.imap.once('ready', () => {
      console.log('IMAP Ready');
      onNewEmail();
    });

    this.imap.once('error', err => console.error('IMAP Error:', err));
    this.imap.once('end', () => console.log('IMAP Connection ended'));

    this.imap.connect();
  }

  openInbox(cb: (err: Error, mailbox) => void) {
    this.imap.openBox('INBOX', false, cb);
  }
}

export default EmailService;
