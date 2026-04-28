import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HolidayAutomationService {
  private apiService = inject(ApiService);

  private funMessages: { [key: string]: string } = {
    'New Year Day': "Welcome 2026! Today's resolution #1: No work. resolution #2: Sleep until noon! 🎊😴",
    'Republic Day': "Drafting our own constitution today: The only constitutional right is 'Relaxation'! 🇮🇳📜",
    'Holi': "Color the code later, color your face today! Don't let the keyboard get 'Bhang' today! 🎨🌈",
    'Gudi Padwa': "New beginnings and sweet Puran Poli! Fly your Gudi high and your stress low! 🪁🍬",
    'May Day': "Labour Day means NO Labour! Enjoy your well-earned break from the grind! ⚒️🛋️",
    'Ganesh Chaturthi': "Ganpati Bappa Morya! Modaks > Meetings. Let Bappa remove all your bugs today! 🐘🥟",
    'Gandhi Jayanti': "Follow the path of non-violence: Be kind to yourself and stay away from the monitor! 🕊️👓",
    'Dussehra': "Victory of good over evil. Today, let's win over our pending tasks by IGNOREing them! 🏹🔥",
    'Diwali': "Festival of lights! Brighten your home, not your screen. Agarwal Sweets is calling! 🎆🍬",
    'Christmas': "Santa arrived but forgot your tasks at the North Pole! Enjoy the 'HO HO HO' holiday! 🎅🎄",
    'Default': "Yay! Today is a Holiday! Enjoy your well-deserved break! 😎🌴"
  };

  async checkAndPostHolidayAnnouncement() {
    try {
      // 1. Get Today's Date (ignoring time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 2. Fetch Holidays
      const holidayRes = await firstValueFrom(this.apiService.getHolidays(today.getFullYear()));
      if (!holidayRes.success || !holidayRes.data) return;

      const holidays = holidayRes.data;
      const todayHoliday = holidays.find((h: any) => {
        const hDate = new Date(h.date);
        hDate.setHours(0, 0, 0, 0);
        return hDate.getTime() === today.getTime();
      });

      if (!todayHoliday) return;

      // 3. Check if we already posted for this holiday to avoid duplicates
      const announcementRes = await firstValueFrom(this.apiService.getAnnouncements());
      if (!announcementRes.success) return;

      const autoTitle = ` ${todayHoliday.name} (${today.toDateString()})`;
      const alreadyPosted = announcementRes.data.some((a: any) => a.title === autoTitle);

      if (alreadyPosted) {
        console.log('Holiday announcement already posted for today.');
        return;
      }

      // 4. Determine Funny Message
      const message = this.funMessages[todayHoliday.name] || this.funMessages['Default'];

      // 5. Create Announcement
      const postData = {
        title: autoTitle,
        content: message,
        type: 'Post',
        imageUrl: '' // We could add holiday-specific GIFs here later
      };

      await firstValueFrom(this.apiService.createAnnouncement(postData));
      console.log(`Automatically posted holiday announcement for: ${todayHoliday.name}`);

    } catch (error) {
      console.error('Holiday Automation Error:', error);
    }
  }
}
