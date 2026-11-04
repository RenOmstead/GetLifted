/**
 * Guidance for training toward a week of Yellowstone day hikes, based on
 * common hiking-coach, National Park Service and sports-medicine advice.
 * It's general information, not medical advice.
 */
export interface TipSection {
  id: string
  title: string
  decor: string
  tips: { title: string; text: string }[]
}

export const TRIP_TIPS: TipSection[] = [
  {
    id: 'train',
    title: 'Training that works',
    decor: 'star_lantern',
    tips: [
      { title: 'One change at a time', text: 'Add time, or incline, or pack weight, never two at once. Every fourth week is lighter. Feet, knees and tendons adapt more slowly than your heart and lungs.' },
      { title: 'Train for hills', text: 'Once a week, walk hills, stairs or an incline treadmill. Going downhill is what makes legs sore, so the step-downs in your plan practise that control.' },
      { title: 'Wear your trip gear', text: 'Train in the boots, socks and daypack you’ll bring. Break new boots in over at least 50 miles before the trip.' },
      { title: 'Rehearse back-to-back days', text: 'Your trip is several active days in a row. Later in the plan, Friday and Saturday walks become a back-to-back pair.' },
      { title: 'Keep two strength days', text: 'Step-ups, lunges, single-leg deadlifts, calf raises and planks protect your knees and ankles on uneven trails.' },
    ],
  },
  {
    id: 'park',
    title: 'Yellowstone specifics',
    decor: 'orb_garland',
    tips: [
      { title: 'It’s high up', text: 'Most of the park sits around 7,000–8,000 ft, and Mount Washburn tops 10,000 ft. Training at home builds fitness, but it doesn’t get your body used to altitude. Expect walks to feel harder there: take the first day or two easy, slow down, rest often and drink plenty.' },
      { title: 'Start early', text: 'Summer afternoons often bring thunderstorms. Aim to be off exposed ridges and summits by early afternoon.' },
      { title: 'Plan your time', text: 'A handy estimate: about 2 mph on the trail, plus an hour for every 1,000 ft you climb, plus stops for the views.' },
      { title: 'Bears and bison', text: 'Carry bear spray where you can reach it, hike in a group and make noise. Stay at least 100 yards from bears and wolves and 25 yards from bison and elk.' },
      { title: 'Stay on boardwalks', text: 'Ground in thermal areas can be a thin crust over scalding water. Never step off the boardwalks or trails there.' },
    ],
  },
  {
    id: 'fuel',
    title: 'Fuel and water on the trail',
    decor: 'sage_mug',
    tips: [
      { title: 'Drink before you’re thirsty', text: 'Dry mountain air and altitude dry you out fast. Sip every 15–20 minutes and carry more water than you think; 2–3 liters for a long day is common.' },
      { title: 'Eat a little, often', text: 'On long hikes, have a snack every hour or so (roughly 150–300 calories): trail mix, a sandwich, fruit or a bar.' },
      { title: 'Salt matters', text: 'Hours of sweating lose salt. Salty snacks or an electrolyte mix help prevent cramps and headaches.' },
      { title: 'Don’t diet on hike days', text: 'Keep your calorie deficit for training weeks at home. On the trip, eat enough to fuel the next day.' },
    ],
  },
  {
    id: 'recover',
    title: 'Recover so you can go again tomorrow',
    decor: 'plum_mug',
    tips: [
      { title: 'Refuel within an hour', text: 'Have carbs plus 20–30 g of protein soon after a long day: a sandwich, yogurt and fruit, or chocolate milk. It refills your muscles for tomorrow.' },
      { title: 'Rehydrate', text: 'Keep drinking through the evening, with some salt. Pale yellow pee means you’ve caught up.' },
      { title: 'Stretch for 10 minutes', text: 'Do the Post-Hike Recovery routine: calves, hamstrings, quads, hip flexors, glutes and feet, finishing with legs up the wall.' },
      { title: 'Look after your feet', text: 'Air your feet, change into dry socks, and treat hot spots before they become blisters. Pack moleskin or blister plasters.' },
      { title: 'Sleep is the main event', text: 'Aim for 7–9 hours. It’s when most of your repair happens.' },
      { title: 'Move gently the next morning', text: 'Do the 5-minute Trail Warm-Up and start the day’s hike slowly. Stiffness usually eases after 15–20 minutes of walking.' },
      { title: 'Know when to rest', text: 'Normal soreness is fine. Sharp pain, swelling, or pain that changes how you walk means take an easy day.' },
    ],
  },
]
