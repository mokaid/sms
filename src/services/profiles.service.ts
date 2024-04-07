import { HttpException } from '@/exceptions/HttpException';
import { Profile } from '@/interfaces/profiles.interface';
import { ProfileDto } from '@/dtos/profiles.dto';
import { ProfileModel } from '@/models/profiles.model';
import { Service } from 'typedi';

@Service()
export class ProfileService {
  public async createProfile(profileData: ProfileDto): Promise<Profile> {
    const findProfile: Profile = await ProfileModel.findOne({ 'ProfileDetails.accountingReference': profileData.ProfileDetails.accountingReference });
    if (findProfile) throw new HttpException(409, `This profile already exists`);

    profileData.Accounts.forEach(account => {
      console.log(account.details.accountType, account.emailCoverageList);
      if (account.details.accountType === 'Vendor' && !account.emailCoverageList) {
        throw new HttpException(400, 'Vendors must have an email coverage list.');
      }
    });

    const createProfileData: Profile = await ProfileModel.create({ ...profileData });

    return createProfileData;
  }

  public async findAllProfile(page: number, limit: number, orderBy: string, sort: string): Promise<{ profiles: Profile[]; totalProfiles: number }> {
    const skip = (page - 1) * limit;
    const sortDirection = sort === 'asc' ? 1 : -1;

    const profilesPromise = ProfileModel.find()
      .skip(skip)
      .limit(limit)
      .sort({ [orderBy]: sortDirection });

    const countPromise = ProfileModel.countDocuments();

    const [profiles, totalProfiles] = await Promise.all([profilesPromise, countPromise]);

    return { profiles, totalProfiles };
  }

  public async findProfileById(profileId: string): Promise<Profile> {
    const findProfiler: Profile = await ProfileModel.findOne({ _id: profileId });
    if (!findProfiler) throw new HttpException(409, "Profile doesn't exist");

    return findProfiler;
  }

  public async findProfileByAccountEmail(accountEmail: string): Promise<Profile> {
    const findProfile: Profile = await ProfileModel.findOne({ 'Accounts.emailCoverageList.email': accountEmail });

    return findProfile;
  }

  public async updateProfile(profileId: string, profileData: ProfileDto): Promise<Profile> {
    if (profileData.ProfileDetails.accountingReference) {
      const findProfile: Profile = await ProfileModel.findOne({
        'ProfileDetails.accountingReference': profileData.ProfileDetails.accountingReference,
      });
      if (findProfile && findProfile._id != profileId) throw new HttpException(409, `This profile already exists`);
    }

    profileData.Accounts.forEach(account => {
      if (account.details.accountType === 'Vendor' && !account.emailCoverageList) {
        throw new HttpException(400, 'Vendors must have an email coverage list.');
      }
    });

    const updateProfileById: Profile = await ProfileModel.findByIdAndUpdate(profileId, { ...profileData }, { new: true });
    if (!updateProfileById) throw new HttpException(409, "Profile doesn't exist");

    return updateProfileById;
  }

  public async deleteProfile(profileId: string): Promise<Profile> {
    const deleteProfileById: Profile = await ProfileModel.findByIdAndDelete(profileId);
    if (!deleteProfileById) throw new HttpException(409, "User doesn't exist");

    return deleteProfileById;
  }
}
