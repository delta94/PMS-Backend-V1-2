import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ParentRepository } from "../shared/parent/parent.repository";
import { Meal } from "./meal/entity/meal.entity";
import { MealRepository } from "./meal/entity/meal.repository";
import { MealResponseData, UploadPictureDto, UploadPictureResponseData } from "./meal/meal.dto";
import axios from "axios";

@Injectable()
export class EventService {
  constructor(private mealRepository: MealRepository, private parentRepository: ParentRepository) {}

  private subString(str: string): string {
    const year: string = str.substr(0, 4);
    const month: string = str.substr(4, 2);
    const day: string = str.substr(6, 2);
    return `${year}-${month}-${day}`;
  }

  public async getPicturesOnTheDay(datetime: string): Promise<MealResponseData> {
    const response: MealResponseData = await this.mealRepository.getOneByDatetimeWithPicture(datetime);
    if(!response) {
      throw new BadRequestException("Not found meal data");
    }
    return response;
  }

  public async setPictureOnTheDay(file: Express.Multer.File, email: string, body: UploadPictureDto): Promise<UploadPictureResponseData> {
    if(!(await this.parentRepository.checkAdminUserEmail(email))) {
      throw new ForbiddenException("Fobidden user");
    }
    const meal: Meal = await this.mealRepository.getOrMakeOne(body.datetime);
    const mealcode: number = +body.mealcode;
    if(mealcode === 1) {
      meal.breakfast_img = `/file/meal/${file.filename}`;
    } else if(mealcode === 2) {
      meal.lunch_img = `/file/meal/${file.filename}`;
    } else if(mealcode === 3) {
      meal.dinner_img = `/file/meal/${file.filename}`;
    } else {
      throw new BadRequestException("Bad request");
    }
    await this.mealRepository.manager.save(meal);
    return { location: `/file/meal/${file.filename}` }
  }

  public async getMealListsOnTheDay(datetime: string): Promise<MealResponseData> {
    const ymd: string = this.subString(datetime);
    const { data } = await axios.get(`https://api.dsm-dms.com/meal/${ymd}`);
    const responseData: MealResponseData = data[ymd];
    return responseData;
  }

  public async setOneByDatetime(datetime: string): Promise<Meal> {
    const meal :Meal = this.mealRepository.create({ datetime });
    return await this.mealRepository.manager.save(meal);
  }

  public async deleteOneByDatetime(datetime: string) {
    return await this.mealRepository.delete({ datetime });
  }
}
