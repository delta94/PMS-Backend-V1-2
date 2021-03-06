import { EntityRepository, getCustomRepository, Repository } from "typeorm";
import { MealResponseData } from "../meal.dto";
import { MealCrawlData, MealListData } from "../meal.type";
import { Meal } from "./meal.entity";

@EntityRepository(Meal)
export class MealRepository extends Repository<Meal> {
  static getQueryRepository() {
    return getCustomRepository(MealRepository);
  }

  private newMeal: Meal;
  private async setCorrectColumn(mealDto: MealCrawlData) {
    if(mealDto.time === "조식") {
      this.newMeal.breakfast_img = mealDto.url;
    } else if(mealDto.time === "중식") {
      this.newMeal.lunch_img = mealDto.url;
    } else {
      this.newMeal.dinner_img = mealDto.url;
    }
  }

  public async getOneByDatetimeWithPicture(datetime: string): Promise<MealResponseData> {
    const meal: MealResponseData = await this.createQueryBuilder("meal")
    .select("meal.breakfast_img", "breakfast")
    .addSelect("meal.lunch_img", "lunch")
    .addSelect("meal.dinner_img", "dinner")
    .where("meal.datetime = :datetime", { datetime })
    .getRawOne();
    if(!meal) {
      return null;
    } else {
      return meal;
    }
  }

  public async setCrawlingData(mealDto: MealCrawlData): Promise<Meal> {
    this.newMeal = await this.findOne({ where: { datetime: mealDto.date } });
    if(this.newMeal && this.newMeal.breakfast_img && this.newMeal.dinner_img && this.newMeal.lunch_img) {
      return this.newMeal;
    } else if(this.newMeal) {
      await this.setCorrectColumn(mealDto);
      return await this.manager.save(this.newMeal);
    } else {
      this.newMeal = new Meal();
      this.newMeal.datetime = mealDto.date;
      await this.setCorrectColumn(mealDto);
      return await this.manager.save(this.newMeal);
    }
  }

  public async setListData(mealDto: MealListData): Promise<void> {
    const meal: Meal = await this.getOrMakeOne(mealDto.date);
    meal[mealDto.time as string] = mealDto.list;
    await this.manager.save(meal);
  }

  public async getOrMakeOne(datetime: string): Promise<Meal> {
    const meal: Meal = await this.findOne({ where: { datetime } });
    return meal ? meal : this.manager.save(this.create({ datetime }));
  }
}