import { HttpException } from '@/exceptions/HttpException';
import { Profile } from '@/interfaces/profiles.interface';
import { ProfileDto } from '@/dtos/profiles.dto';
import { ProfileModel } from '@/models/profiles.model';
import { Service } from 'typedi';

@Service()
export class ProfileService {
  public async createProfile(profileData: ProfileDto): Promise<Profile> {
    const findProfile: Profile = await ProfileModel.findOne({ 'profileDetails.accountingReference': profileData.profileDetails.accountingReference });
    if (findProfile) throw new HttpException(409, `This profile already exists`);

    const createProfileData: Profile = await ProfileModel.create({ ...profileData });

    return createProfileData;
  }
}
