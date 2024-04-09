import { ParsedItem, SchemaConfig } from '@/interfaces/email.interface';

import Container from 'typedi';
import EmailService from './email.service';
import { FileFormat } from '@/enums/profiles.enums';
import { ObjectId } from 'mongoose';
import { ProfileModel } from '@/models/profiles.model';
import { ProfileService } from './profiles.service';
import { imapConfig } from '@/config/email';
import { simpleParser } from 'mailparser';

const xlsx = require('xlsx');
const Imap = require('imap');
const { Service } = require('typedi');

@Service()
class EmailFetcherService {
  private imap;
  public profile = Container.get(ProfileService);
  private emailService: EmailService;

  constructor() {
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
    foundAccount = profile.Accounts.find(account => {
      const username = account.connection.userName.toLowerCase();
      return emailSubject.toLowerCase().includes(username) || emailText.toLowerCase().includes(username);
    });

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
      return { account: foundAccount, attachment: relevantAttachment };
    } else {
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
                  const schemaConfig = {
                    headerRow: 1, // Assuming headers start at the second row
                    fields: {
                      country: ['Country', 'Country Name', 'CNT'],
                      MCC: ['MCC', 'Mobile Country Code'],
                      MNC: ['MNC', 'Mobile Network Code'],
                      price: ['Price', 'Rate'],
                      currency: ['Currency', 'Curr'], // Default to 'EUR' if column is absent or value is missing
                    },
                  };

                  function parseCsvWithSchema(content: Buffer, schemaConfig: SchemaConfig): ParsedItem[] {
                    const lines: string[] = content
                      .toString('utf8')
                      .split('\n')
                      .filter(line => line.trim() !== '');
                    const headers: string[] = lines[schemaConfig.headerRow - 1].split(',').map(header => header.trim().replace(/^"|"$/g, ''));

                    const columnIndexMap: { [key: string]: number } = {};
                    Object.entries(schemaConfig.fields).forEach(([fieldName, possibleHeaders]) => {
                      columnIndexMap[fieldName] = headers.findIndex(
                        header => possibleHeaders.some(possibleHeader => possibleHeader === header), // Use type assertion here
                      );
                    });

                    return lines.slice(schemaConfig.headerRow).map(line => {
                      const data = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
                      const obj: Partial<ParsedItem> = {};
                      Object.entries(columnIndexMap).forEach(([fieldName, index]) => {
                        if (index >= 0) {
                          obj[fieldName as keyof ParsedItem] = data[index]; // Use keyof ParsedItem for index signature
                        }
                      });

                      if (!obj.currency) obj.currency = 'EUR';

                      return obj as ParsedItem; // Assert that obj is ParsedItem
                    });
                  }

                  // Example usage with csvContent and schemaConfig provided
                  const csvContent = Buffer.from(result.attachment.content, 'base64'); // Assuming base64 encoding
                  const parsedData = parseCsvWithSchema(csvContent, schemaConfig);

                  // Correcting the usage of field names in the parsedData mapping
                  const priceListItems = parsedData.map(item => ({
                    customId: `${item.country}_${item.MCC}_${item.MNC}`, // Generate custom ID
                    country: item.country, // Use the field names as defined in schemaConfig, not the original CSV headers
                    MCC: item.MCC,
                    MNC: item.MNC,
                    price: item.price, // Already converted to float in parseCsvWithSchema
                    currency: item.currency, // Already defaulted to 'EUR' in parseCsvWithSchema if necessary
                  }));

                  // Function to validate if a PriceListItem has the necessary data
                  function isValidPriceListItem(item) {
                    return item.country && item.MCC && item.price; // Extend this validation as needed
                  }

                  async function updatePriceList(accountId: ObjectId, newPriceListItems) {
                    const account = await ProfileModel.findOne({ 'Accounts._id': accountId });
                    if (!account) {
                      throw new Error('Account not found');
                    }

                    const accountIndex = account.Accounts.findIndex((acc: any) => acc._id.equals(accountId));
                    if (accountIndex === -1) {
                      throw new Error("Account not found in profile's accounts");
                    }

                    if (account.Accounts[accountIndex].emailCoverageList.deleteAllExisting) {
                      // If deleteAllExisting is true, replace the priceList with new items
                      account.Accounts[accountIndex].priceList = newPriceListItems.filter(isValidPriceListItem);
                    } else {
                      // Update existing items or append new ones
                      const updatedPriceList = [];

                      // Use a Map for efficient look-up by customId

                      newPriceListItems.forEach(newItem => {
                        if (!isValidPriceListItem(newItem)) return;

                        const existingItemIndex = account.Accounts[accountIndex].priceList.findIndex(item => item.customId === newItem.customId);
                        if (existingItemIndex !== -1) {
                          const existingItem = account.Accounts[accountIndex].priceList[existingItemIndex];
                          if (existingItem.price !== newItem.price) {
                            // Directly update the existing item in the original list
                            account.Accounts[accountIndex].priceList[existingItemIndex] = {
                              ...existingItem,
                              oldPrice: existingItem.price, // Assuming oldPrice tracking is desired
                              price: newItem.price,
                              country: newItem.country, // Make sure country is defined
                              customId: `${newItem.country}_${newItem.MCC}_${newItem.MNC}`,
                              MCC: newItem.MCC, // Include MCC
                              MNC: newItem.MNC, // Include MNC
                            };
                          }
                        } else {
                          // Item is new
                          account.Accounts[accountIndex].priceList.push(newItem);
                        }
                      });

                      // Now, ensure all existing items not in the new list are still retained
                      account.Accounts[accountIndex].priceList.forEach(item => {
                        if (!updatedPriceList.some(updatedItem => updatedItem.customId === item.customId)) {
                          updatedPriceList.push(item);
                        }
                      });

                      // Assign the updated list back to the account
                      account.Accounts[accountIndex].priceList = updatedPriceList;
                    }

                    // Save the updated document
                    await account.save();
                  }

                  // Call update function
                  updatePriceList(result.account._id, priceListItems)
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
