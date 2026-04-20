-- Add comprehensive trivia questions and multiplication tables
-- This script adds the new questions to the existing system

-- Create trivia_questions table for storing all trivia questions
CREATE TABLE IF NOT EXISTS public.trivia_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL, -- Index of correct answer (0-based)
  category VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  points INTEGER DEFAULT 10,
  time_limit INTEGER DEFAULT 30, -- seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create multiplication_questions table for storing multiplication problems
CREATE TABLE IF NOT EXISTS public.multiplication_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factor1 INTEGER NOT NULL,
  factor2 INTEGER NOT NULL,
  product INTEGER NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  time_limit INTEGER DEFAULT 15, -- seconds
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Pop Culture Questions (Easy - 40 questions)
INSERT INTO public.trivia_questions (question, options, correct_answer, category, difficulty, points, time_limit) VALUES
-- Easy Pop Culture Questions
('What pop star embarked on the record-breaking Eras Tour starting in 2023?', '["Taylor Swift", "Ariana Grande", "Billie Eilish", "Olivia Rodrigo"]', 0, 'Pop Culture', 'easy', 10, 30),
('Which social media platform is primarily known for its short-form video content and viral dance challenges?', '["Instagram", "TikTok", "Snapchat", "Twitter"]', 1, 'Pop Culture', 'easy', 10, 30),
('What Marvel superhero wields the hammer Mjölnir?', '["Iron Man", "Thor", "Captain America", "Hulk"]', 1, 'Pop Culture', 'easy', 10, 30),
('The song "Hotline Bling" is a major hit for which Canadian rapper?', '["Drake", "The Weeknd", "Justin Bieber", "Shawn Mendes"]', 0, 'Pop Culture', 'easy', 10, 30),
('What actress starred as Barbie in the 2023 movie Barbie?', '["Emma Stone", "Margot Robbie", "Scarlett Johansson", "Jennifer Lawrence"]', 1, 'Pop Culture', 'easy', 10, 30),
('Who is often referred to as the "King of Pop"?', '["Elvis Presley", "Michael Jackson", "Prince", "Stevie Wonder"]', 1, 'Pop Culture', 'easy', 10, 30),
('What name did Taylor Swift give to her re-recorded albums (e.g., Fearless (Taylor''s Version))?', '["Taylor''s Version (TV)", "Re-recorded", "Taylor''s Edition", "Swift Version"]', 0, 'Pop Culture', 'easy', 10, 30),
('Which iconic ''90s boy band sang the hit "I Want It That Way"?', '["NSYNC", "Backstreet Boys", "New Kids on the Block", "Boyz II Men"]', 1, 'Pop Culture', 'easy', 10, 30),
('"You Only Live Once," often abbreviated to YOLO, was popularized by which Drake song?', '["Started From the Bottom", "The Motto", "God''s Plan", "Hotline Bling"]', 1, 'Pop Culture', 'easy', 10, 30),
('In the US version of The Office, what paper company does the show focus on?', '["Dunder Mifflin", "Staples", "Office Depot", "Paper Company"]', 0, 'Pop Culture', 'easy', 10, 30),
('What is the name of Taylor Swift''s first album, released in 2006?', '["Fearless", "Taylor Swift", "Speak Now", "Red"]', 1, 'Pop Culture', 'easy', 10, 30),
('What iconic fashion accessory did Carrie Bradshaw popularize in Sex and the City?', '["The Fendi Baguette Bag", "Manolo Blahniks", "Chanel No. 5", "Hermès Birkin"]', 0, 'Pop Culture', 'easy', 10, 30),
('Which popular Christmas song by Mariah Carey re-enters the charts almost every year?', '["Last Christmas", "All I Want for Christmas is You", "Santa Baby", "Jingle Bell Rock"]', 1, 'Pop Culture', 'easy', 10, 30),
('What name does actor Dwayne Johnson famously go by?', '["The Rock", "Stone Cold", "The Undertaker", "John Cena"]', 0, 'Pop Culture', 'easy', 10, 30),
('What movie features the famous quote: "I''m the king of the world!"?', '["Avatar", "Titanic", "Forrest Gump", "The Lion King"]', 1, 'Pop Culture', 'easy', 10, 30),
('Who was the first winner of the reality singing competition American Idol?', '["Kelly Clarkson", "Carrie Underwood", "Jennifer Hudson", "Fantasia"]', 0, 'Pop Culture', 'easy', 10, 30),
('What is the name of Taylor Swift''s cat named after a character from the TV show Law & Order: Special Victims Unit?', '["Olivia Benson", "Meredith Grey", "Cristina Yang", "Miranda Bailey"]', 0, 'Pop Culture', 'easy', 10, 30),
('What singer is also known by her real name, Robyn Rihanna Fenty?', '["Rihanna", "Beyoncé", "Alicia Keys", "Beyoncé"]', 0, 'Pop Culture', 'easy', 10, 30),
('Which streaming service released the sci-fi horror series Stranger Things?', '["Netflix", "Hulu", "Amazon Prime", "Disney+"]', 0, 'Pop Culture', 'easy', 10, 30),
('What is the name of the fictional wizarding school in the Harry Potter series?', '["Hogwarts", "Beauxbatons", "Durmstrang", "Ilvermorny"]', 0, 'Pop Culture', 'easy', 10, 30),
('The phrase "What''s the tea?" on social media is used to ask for what?', '["Gossip/News", "Beverage", "Weather", "Time"]', 0, 'Pop Culture', 'easy', 10, 30),
('What food item is Baby Yoda (Grogu) often seen eating in The Mandalorian?', '["Frogs (or Frog Soup/Eggs)", "Cookies", "Ice Cream", "Pizza"]', 0, 'Pop Culture', 'easy', 10, 30),
('What popular coffee-inspired pop song dominated the charts in the summer of 2024 for Sabrina Carpenter?', '["Espresso", "Coffee", "Latte", "Cappuccino"]', 0, 'Pop Culture', 'easy', 10, 30),
('Which animated film features a lion cub named Simba?', '["The Lion King", "Bambi", "Dumbo", "Aladdin"]', 0, 'Pop Culture', 'easy', 10, 30),
('What is the popular nickname for the annual music festival held in Indio, California, that Beyoncé famously headlined as "Beychella"?', '["Coachella", "Bonnaroo", "Lollapalooza", "Glastonbury"]', 0, 'Pop Culture', 'easy', 10, 30),
('Drake''s acting career began on which Canadian teen drama series?', '["Degrassi: The Next Generation", "Riverdale", "The Vampire Diaries", "Gossip Girl"]', 0, 'Pop Culture', 'easy', 10, 30),
('Who is the lead singer of the band Coldplay?', '["Chris Martin", "Bono", "Eddie Vedder", "Thom Yorke"]', 0, 'Pop Culture', 'easy', 10, 30),
('What does the social media acronym "DM" stand for?', '["Direct Message", "Daily Mail", "Data Management", "Digital Media"]', 0, 'Pop Culture', 'easy', 10, 30),
('What is the title of Miley Cyrus''s 2023 hit song that won her her first Grammy?', '["Flowers", "Wrecking Ball", "Party in the USA", "The Climb"]', 0, 'Pop Culture', 'easy', 10, 30),
('What city does Batman protect?', '["Gotham City", "Metropolis", "Central City", "Star City"]', 0, 'Pop Culture', 'easy', 10, 30),
('What is the popular nickname for the group of fans who follow Lady Gaga?', '["Little Monsters", "Swifties", "Beyhive", "Arianators"]', 0, 'Pop Culture', 'easy', 10, 30),
('What clothing accessory did Taylor Swift leave behind according to the lyrics of "All Too Well"?', '["Scarf", "Jacket", "Hat", "Gloves"]', 0, 'Pop Culture', 'easy', 10, 30),
('Which rapper is featured on Taylor Swift''s song "Fortnight"?', '["Post Malone", "Drake", "Kendrick Lamar", "Travis Scott"]', 0, 'Pop Culture', 'easy', 10, 30),
('The "Renegade" was a popular viral dance on which platform?', '["TikTok", "Instagram", "YouTube", "Snapchat"]', 0, 'Pop Culture', 'easy', 10, 30),
('What is the name of the fictional town in which The Simpsons live?', '["Springfield", "Shelbyville", "Ogdenville", "North Haverbrook"]', 0, 'Pop Culture', 'easy', 10, 30),
('The 2013 dance craze "The Macarena" was brought into the world by which Spanish musical group?', '["Los del Río", "Ricky Martin", "Enrique Iglesias", "Shakira"]', 0, 'Pop Culture', 'easy', 10, 30),
('What is the name of Beyoncé and Jay-Z''s oldest daughter?', '["Blue Ivy Carter", "Rumi Carter", "Sir Carter", "Beyoncé Carter"]', 0, 'Pop Culture', 'easy', 10, 30),
('Which former boy band member had a massive solo hit with the song "Watermelon Sugar"?', '["Harry Styles", "Zayn Malik", "Liam Payne", "Niall Horan"]', 0, 'Pop Culture', 'easy', 10, 30),
('What does the Star Wars phrase "May the Force be with you" express?', '["A wish of good luck/protection", "A greeting", "A farewell", "A warning"]', 0, 'Pop Culture', 'easy', 10, 30),
('What singer famously wore a dress made of raw meat to the 2010 MTV Video Music Awards?', '["Lady Gaga", "Katy Perry", "Rihanna", "Beyoncé"]', 0, 'Pop Culture', 'easy', 10, 30);

-- Insert Pop Culture Questions (Medium - 40 questions)
INSERT INTO public.trivia_questions (question, options, correct_answer, category, difficulty, points, time_limit) VALUES
-- Medium Pop Culture Questions
('What nickname was given to Beyoncé''s 2018 groundbreaking Coachella performance, which celebrated HBCU culture?', '["Beychella", "Beyoncé Coachella", "Homecoming", "Formation"]', 0, 'Pop Culture', 'medium', 15, 25),
('Before his solo career, Dave Grohl was the drummer for which iconic grunge band?', '["Nirvana", "Pearl Jam", "Soundgarden", "Alice in Chains"]', 0, 'Pop Culture', 'medium', 15, 25),
('Which two rappers engaged in a notable public feud involving back-and-forth diss tracks in 2024?', '["Drake and Kendrick Lamar", "Eminem and Machine Gun Kelly", "Kanye West and Jay-Z", "Nicki Minaj and Cardi B"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the real name of the singer and songwriter Lana Del Rey?', '["Elizabeth Woolridge Grant", "Stefani Germanotta", "Robyn Fenty", "Taylor Swift"]', 0, 'Pop Culture', 'medium', 15, 25),
('In the original 1999 song by TLC, what does "scrub" stand for?', '["A guy that can''t get no love from me", "Someone who cleans", "A type of clothing", "A dance move"]', 0, 'Pop Culture', 'medium', 15, 25),
('Taylor Swift was the first female artist to win Album of the Year at the Grammys three times. Which three albums earned her those awards?', '["Fearless, 1989, and folklore", "Taylor Swift, Fearless, and 1989", "Speak Now, Red, and 1989", "Fearless, Speak Now, and Red"]', 0, 'Pop Culture', 'medium', 15, 25),
('What 2001 Jake Gyllenhaal movie is considered a cult classic for its time-travel themes and a giant rabbit?', '["Donnie Darko", "Source Code", "Enemy", "Nightcrawler"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the name of Drake''s record label and clothing line, often abbreviated to OVO?', '["October''s Very Own", "Ovo Sound", "Drake Records", "OVO Clothing"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the name of the ice cream parlor Steve and Robin work at in Season 3 of Stranger Things?', '["Scoops Ahoy", "Baskin Robbins", "Dairy Queen", "Ben & Jerry''s"]', 0, 'Pop Culture', 'medium', 15, 25),
('Which popular TikTok dance craze (the arm-swinging one) was popularized by "The Backpack Kid" in 2017 during a Katy Perry performance?', '["The Floss", "The Renegade", "The Savage", "The Whip"]', 0, 'Pop Culture', 'medium', 15, 25),
('What Friends character was Courteney Cox originally asked to play, before she was cast as Monica Geller?', '["Rachel Green", "Phoebe Buffay", "Janice Litman-Goralnik", "Emily Waltham"]', 0, 'Pop Culture', 'medium', 15, 25),
('The song "Running Up That Hill" experienced a massive resurgence in popularity after being featured in which Netflix show?', '["Stranger Things", "The Crown", "Bridgerton", "Ozark"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the name of the high school in the classic ''90s sitcom Saved by the Bell?', '["Bayside High", "West Beverly High", "Rydell High", "Sweet Valley High"]', 0, 'Pop Culture', 'medium', 15, 25),
('Taylor Swift''s album Speak Now (2010) is notable because she is the sole writer on every track. True or False?', '["True", "False", "Only half the tracks", "Only the singles"]', 0, 'Pop Culture', 'medium', 15, 25),
('What British rock band''s album is named after the age of the singer when she wrote them (e.g., 19, 21, 25)?', '["Adele", "Amy Winehouse", "Florence Welch", "Dua Lipa"]', 0, 'Pop Culture', 'medium', 15, 25),
('The Megxit portmanteau referred to which British Royal Family members stepping back from their senior roles?', '["Prince Harry and Meghan Markle", "Prince William and Kate Middleton", "Prince Charles and Camilla", "Queen Elizabeth and Prince Philip"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the real name of the rapper and actor Ice Cube?', '["O''Shea Jackson", "Andre Young", "Calvin Broadus", "Marshall Mathers"]', 0, 'Pop Culture', 'medium', 15, 25),
('What film studio produced the popular Toy Story movie franchise?', '["Pixar", "DreamWorks", "Disney", "Blue Sky"]', 0, 'Pop Culture', 'medium', 15, 25),
('Which famous musician is Taylor Swift named after?', '["James Taylor", "Taylor Hicks", "Taylor Dayne", "Taylor Hawkins"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the name of the fictional town in Indiana where Stranger Things takes place?', '["Hawkins, Indiana", "Springfield, Illinois", "Smallville, Kansas", "Mystic Falls, Virginia"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the highest-grossing film of all time (unadjusted for inflation)?', '["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"]', 0, 'Pop Culture', 'medium', 15, 25),
('Which two singers co-headlined the "FutureSex/LoveShow" tour, a widely successful 2007 collaboration?', '["Justin Timberlake and Christina Aguilera", "Justin Timberlake and Beyoncé", "Justin Timberlake and Rihanna", "Justin Timberlake and Pink"]', 0, 'Pop Culture', 'medium', 15, 25),
('The 2023 viral song "Water" helped propel the South African music genre Amapiano to global attention, and was sung by which South African artist?', '["Tyla", "Master KG", "Mafikizolo", "Ladysmith Black Mambazo"]', 0, 'Pop Culture', 'medium', 15, 25),
('What two-word term is used for the trend of "dressing nicely to do mundane things" that gained popularity on TikTok in 2024?', '["Grown-up Dress Up", "Fancy Errands", "Dress Up", "Style Challenge"]', 0, 'Pop Culture', 'medium', 15, 25),
('What classic story-turned-Disney-movie is referenced in the lyric "Peter losing Wendy" on Taylor Swift''s folklore album?', '["Peter Pan", "Alice in Wonderland", "Cinderella", "Snow White"]', 0, 'Pop Culture', 'medium', 15, 25),
('Which two actors from the US version of The Office were high school classmates?', '["John Krasinski and B.J. Novak", "Steve Carell and Rainn Wilson", "Jenna Fischer and Angela Kinsey", "Mindy Kaling and Ellie Kemper"]', 0, 'Pop Culture', 'medium', 15, 25),
('Who was the first person ever inducted into the Rock and Roll Hall of Fame as a solo artist, despite already being in with a band?', '["Willie Nelson", "Bob Dylan", "Paul McCartney", "Eric Clapton"]', 0, 'Pop Culture', 'medium', 15, 25),
('Which pop icon performed with a snake around her shoulders at the 2001 MTV Video Music Awards?', '["Britney Spears", "Madonna", "Christina Aguilera", "Pink"]', 0, 'Pop Culture', 'medium', 15, 25),
('What musical is the source of the songs "Summer Nights" and "You''re the One that I Want"?', '["Grease", "Hairspray", "Mamma Mia!", "The Sound of Music"]', 0, 'Pop Culture', 'medium', 15, 25),
('What social media company launched the "Threads" app in 2023 as a direct competitor to Twitter/X?', '["Meta (formerly Facebook)", "Google", "Microsoft", "Amazon"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is Drake''s first name, which he used as an actor on Degrassi?', '["Aubrey", "Drake", "Jimmy", "Wheelchair Jimmy"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the full name of Frodo''s best friend in The Lord of the Rings trilogy?', '["Samwise Gamgee", "Peregrin Took", "Meriadoc Brandybuck", "Bilbo Baggins"]', 0, 'Pop Culture', 'medium', 15, 25),
('Which Taylor Swift song is widely rumored to be an apology to her ex, Taylor Lautner?', '["Back to December", "Dear John", "All Too Well", "We Are Never Getting Back Together"]', 0, 'Pop Culture', 'medium', 15, 25),
('What popular video game studio is responsible for creating both the Grand Theft Auto and Red Dead Redemption series?', '["Rockstar Games", "EA Games", "Ubisoft", "Activision"]', 0, 'Pop Culture', 'medium', 15, 25),
('The character Bombalurina, played by Taylor Swift, appeared in the movie adaptation of which critically panned musical?', '["Cats", "Les Misérables", "Mamma Mia!", "The Greatest Showman"]', 0, 'Pop Culture', 'medium', 15, 25),
('Which rapper''s debut studio album, released in 2010, was titled Thank Me Later?', '["Drake", "Kendrick Lamar", "J. Cole", "Big Sean"]', 0, 'Pop Culture', 'medium', 15, 25),
('The "Savage" dance, which became a massive TikTok trend, was choreographed to a song by which female rapper?', '["Megan Thee Stallion", "Cardi B", "Nicki Minaj", "Doja Cat"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the title of Olivia Rodrigo''s debut studio album, released in 2021?', '["Sour", "Sweet", "Bitter", "Tangy"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the name of the fictional town in which the animated show Family Guy is set?', '["Quahog, Rhode Island", "Springfield, Illinois", "Shelbyville, Kentucky", "Ogdenville, New York"]', 0, 'Pop Culture', 'medium', 15, 25),
('What is the name of the famous street in London where The Beatles recorded their final album and took an iconic photo walking across the crosswalk?', '["Abbey Road", "Carnaby Street", "Oxford Street", "Regent Street"]', 0, 'Pop Culture', 'medium', 15, 25);

-- Insert Pop Culture Questions (Hard - 20 questions)
INSERT INTO public.trivia_questions (question, options, correct_answer, category, difficulty, points, time_limit) VALUES
-- Hard Pop Culture Questions
('What was Taylor Swift''s songwriting pseudonym used when co-writing the song "This Is What You Came For" with Calvin Harris?', '["Nils Sjöberg", "William Bowery", "Betty", "James"]', 0, 'Pop Culture', 'hard', 20, 20),
('What is the official term for the fictional language spoken by the Na''vi people in the Avatar film franchise?', '["Na''vi", "Pandoran", "Avatar", "Alien"]', 0, 'Pop Culture', 'hard', 20, 20),
('Which Drake album, released in 2016, was originally supposed to be called Views From the 6?', '["Views", "More Life", "Scorpion", "Certified Lover Boy"]', 0, 'Pop Culture', 'hard', 20, 20),
('What was the title of Eminem''s debut album released in 1996, before he achieved mainstream fame?', '["Infinite", "The Slim Shady LP", "The Marshall Mathers LP", "Encore"]', 0, 'Pop Culture', 'hard', 20, 20),
('What famous 1980s music video, by a-ha, featured the blend of live-action and pencil-sketch animation?', '["Take On Me", "The Sun Always Shines on TV", "Hunting High and Low", "Stay on These Roads"]', 0, 'Pop Culture', 'hard', 20, 20),
('In the original Toy Story film, what was the name of the boy who owned Woody and Buzz?', '["Andy", "Sid", "Al", "Lotso"]', 0, 'Pop Culture', 'hard', 20, 20),
('Which artist''s album, released in 2024, monopolized the Billboard Hot 100''s top 14 spots, becoming the first to do so?', '["Taylor Swift (The Tortured Poets Department)", "Drake", "Beyoncé", "Ariana Grande"]', 0, 'Pop Culture', 'hard', 20, 20),
('Which two songs did Taylor Swift write for The Hunger Games movie soundtrack?', '["Safe & Sound, Eyes Open", "Eyes Open, Sweeter than Fiction", "Safe & Sound, Sweeter than Fiction", "Eyes Open, The Last Time"]', 0, 'Pop Culture', 'hard', 20, 20),
('In The White Lotus Season 1, where did the events primarily take place?', '["Hawaii (Maui, specifically the Four Seasons Resort Maui at Wailea)", "Sicily", "Thailand", "Mexico"]', 0, 'Pop Culture', 'hard', 20, 20),
('Before becoming an actor and comedian, Ken Jeong had a professional career in what field?', '["Medicine (He is a licensed physician)", "Law", "Engineering", "Teaching"]', 0, 'Pop Culture', 'hard', 20, 20),
('Which member of the band Bon Iver co-wrote and provided vocals for Taylor Swift''s song "Exile"?', '["Justin Vernon", "Matt Berninger", "Ben Gibbard", "Conor Oberst"]', 0, 'Pop Culture', 'hard', 20, 20),
('What was the name of the 2017 Disney Channel Original Movie that propelled the acting and singing careers of several stars, including Zac Efron and Vanessa Hudgens?', '["High School Musical", "Camp Rock", "Lemonade Mouth", "Descendants"]', 0, 'Pop Culture', 'hard', 20, 20),
('What is the full name of the music producer who co-produced the majority of Taylor Swift''s 1989 album with her?', '["Max Martin (Karl Martin Sandberg)", "Jack Antonoff", "Ryan Tedder", "Shellback"]', 0, 'Pop Culture', 'hard', 20, 20),
('Which highly-acclaimed 2019 South Korean film won the Academy Award for Best Picture?', '["Parasite", "Minari", "Squid Game", "The Handmaiden"]', 0, 'Pop Culture', 'hard', 20, 20),
('Which viral TikTok dance featuring exaggerated arm movements came first: "Savage" or "Say So"?', '["Say So", "Savage", "They were released at the same time", "Neither"]', 0, 'Pop Culture', 'hard', 20, 20),
('What American rock band, led by co-founders Chris Martin and Jonny Buckland, won Record of the Year at the 2004 Grammys for their single "Clocks"?', '["Coldplay", "Radiohead", "U2", "The Killers"]', 0, 'Pop Culture', 'hard', 20, 20),
('What is the birth name of Queen singer Freddie Mercury?', '["Farrokh Bulsara", "Freddie Mercury", "Roger Taylor", "Brian May"]', 0, 'Pop Culture', 'hard', 20, 20),
('Which country was the setting for the first season of the HBO anthology series True Detective?', '["Louisiana", "Mississippi", "Alabama", "Texas"]', 0, 'Pop Culture', 'hard', 20, 20),
('What is the name of the luxury handbag brand that Drake famously collects for his future wife?', '["Hermès Birkin", "Chanel", "Louis Vuitton", "Gucci"]', 0, 'Pop Culture', 'hard', 20, 20),
('In the Harry Potter series, what is the name for non-magical people?', '["Muggles", "Squibs", "No-Majs", "Mundanes"]', 0, 'Pop Culture', 'hard', 20, 20);

-- Insert Animal Questions (Easy - 40 questions)
INSERT INTO public.trivia_questions (question, options, correct_answer, category, difficulty, points, time_limit) VALUES
-- Easy Animal Questions
('What is the tallest animal in the world?', '["Giraffe", "Elephant", "Ostrich", "Camel"]', 0, 'Animals', 'easy', 10, 30),
('How many legs does an octopus have?', '["Eight", "Six", "Ten", "Twelve"]', 0, 'Animals', 'easy', 10, 30),
('What bird can fly backward?', '["Hummingbird", "Eagle", "Owl", "Parrot"]', 0, 'Animals', 'easy', 10, 30),
('What do you call a baby kangaroo?', '["A joey", "A cub", "A pup", "A kit"]', 0, 'Animals', 'easy', 10, 30),
('Which large mammal cannot jump?', '["Elephant", "Hippo", "Rhino", "Giraffe"]', 0, 'Animals', 'easy', 10, 30),
('What is a group of lions called?', '["A pride", "A pack", "A herd", "A flock"]', 0, 'Animals', 'easy', 10, 30),
('What is the largest mammal on Earth?', '["Blue whale", "African elephant", "Giraffe", "Polar bear"]', 0, 'Animals', 'easy', 10, 30),
('Which animal is often called "man''s best friend"?', '["Dog", "Cat", "Horse", "Bird"]', 0, 'Animals', 'easy', 10, 30),
('What fish is Nemo from Finding Nemo?', '["Clownfish", "Goldfish", "Angelfish", "Tropical fish"]', 0, 'Animals', 'easy', 10, 30),
('What color is a polar bear''s skin (under its fur)?', '["Black", "White", "Pink", "Brown"]', 0, 'Animals', 'easy', 10, 30),
('A rhino''s horn is made of what material, the same as your fingernails?', '["Keratin", "Bone", "Cartilage", "Hair"]', 0, 'Animals', 'easy', 10, 30),
('What is the fastest land animal?', '["Cheetah", "Lion", "Tiger", "Leopard"]', 0, 'Animals', 'easy', 10, 30),
('Which animals eat primarily bamboo?', '["Pandas", "Koalas", "Sloths", "Lemurs"]', 0, 'Animals', 'easy', 10, 30),
('What are the young of a goat called?', '["Kids", "Lambs", "Pups", "Cubs"]', 0, 'Animals', 'easy', 10, 30),
('How many humps does a Bactrian camel typically have?', '["Two", "One", "Three", "None"]', 0, 'Animals', 'easy', 10, 30),
('What animal produces silk?', '["Silkworm", "Spider", "Caterpillar", "Butterfly"]', 0, 'Animals', 'easy', 10, 30),
('What is the main diet of a koala?', '["Eucalyptus leaves", "Bamboo", "Grass", "Fruit"]', 0, 'Animals', 'easy', 10, 30),
('True or False: Bats are blind.', '["False (They have good eyesight)", "True", "Partially true", "Depends on the species"]', 0, 'Animals', 'easy', 10, 30),
('Which bird is the symbol of peace?', '["Dove", "Eagle", "Owl", "Swan"]', 0, 'Animals', 'easy', 10, 30),
('What is a group of fish called?', '["A school", "A shoal", "A pod", "A swarm"]', 0, 'Animals', 'easy', 10, 30),
('What is the scientific term for an animal that eats only plants?', '["Herbivore", "Carnivore", "Omnivore", "Insectivore"]', 0, 'Animals', 'easy', 10, 30),
('Which large marine animal is sometimes referred to as a "sea cow"?', '["Manatee", "Dolphin", "Whale", "Seal"]', 0, 'Animals', 'easy', 10, 30),
('What animal has a heart located in its head?', '["Shrimp", "Crab", "Lobster", "Squid"]', 0, 'Animals', 'easy', 10, 30),
('What insect is known for tasting with its feet?', '["Butterfly", "Bee", "Ant", "Fly"]', 0, 'Animals', 'easy', 10, 30),
('Which dog breed is known for having a blue-black tongue?', '["Chow Chow", "Shar Pei", "Akita", "Shiba Inu"]', 0, 'Animals', 'easy', 10, 30),
('What is the plural of "moose"?', '["Moose", "Meese", "Moosees", "Moosei"]', 0, 'Animals', 'easy', 10, 30),
('What animal has the longest neck relative to its body size?', '["Giraffe", "Ostrich", "Camel", "Llama"]', 0, 'Animals', 'easy', 10, 30),
('What reptile is known for changing its color to blend in?', '["Chameleon", "Gecko", "Iguana", "Skink"]', 0, 'Animals', 'easy', 10, 30),
('Which animal is famous for its long memory?', '["Elephant", "Dolphin", "Whale", "Octopus"]', 0, 'Animals', 'easy', 10, 30),
('How many legs does an insect have?', '["Six", "Eight", "Ten", "Twelve"]', 0, 'Animals', 'easy', 10, 30),
('What is the name of the male swan?', '["Cob", "Drake", "Gander", "Tom"]', 0, 'Animals', 'easy', 10, 30),
('What animal lives in a "den" and hibernates in the winter?', '["Bear", "Fox", "Wolf", "Rabbit"]', 0, 'Animals', 'easy', 10, 30),
('Which fish is the largest shark species?', '["Whale shark", "Great white shark", "Tiger shark", "Hammerhead shark"]', 0, 'Animals', 'easy', 10, 30),
('What do spiders use to build their webs?', '["Silk (or silk thread)", "Saliva", "Hair", "Mucus"]', 0, 'Animals', 'easy', 10, 30),
('What animal is known for "holding hands" while sleeping in the water to avoid drifting apart?', '["Sea otter", "Dolphin", "Whale", "Seal"]', 0, 'Animals', 'easy', 10, 30),
('What is the slowest mammal on Earth?', '["Three-toed sloth", "Koala", "Panda", "Hippo"]', 0, 'Animals', 'easy', 10, 30),
('What type of animal is a capybara?', '["Rodent (the largest one)", "Marsupial", "Primate", "Carnivore"]', 0, 'Animals', 'easy', 10, 30),
('True or False: A crocodile can stick out its tongue.', '["False (Their tongue is fixed to the bottom of their mouth)", "True", "Only when eating", "Only when threatened"]', 0, 'Animals', 'easy', 10, 30),
('What gives flamingos their pink color?', '["Their diet of algae and brine shrimp (carotenoids)", "Genetics", "Sun exposure", "Water they drink"]', 0, 'Animals', 'easy', 10, 30),
('What is a group of owls called?', '["A parliament", "A flock", "A murder", "A gaggle"]', 0, 'Animals', 'easy', 10, 30);

-- Insert Animal Questions (Medium - 40 questions)
INSERT INTO public.trivia_questions (question, options, correct_answer, category, difficulty, points, time_limit) VALUES
-- Medium Animal Questions
('Which animal''s fingerprints are so similar to human fingerprints that they could be mistaken at a crime scene?', '["Koala", "Chimpanzee", "Gorilla", "Orangutan"]', 0, 'Animals', 'medium', 15, 25),
('What is the only mammal capable of true and sustained flight?', '["Bat", "Flying squirrel", "Sugar glider", "Flying lemur"]', 0, 'Animals', 'medium', 15, 25),
('How many hearts does an octopus have?', '["Three", "One", "Two", "Four"]', 0, 'Animals', 'medium', 15, 25),
('What is the longest gestation period (pregnancy) of any mammal?', '["Elephant (around 22 months)", "Giraffe (15 months)", "Whale (18 months)", "Rhinoceros (16 months)"]', 0, 'Animals', 'medium', 15, 25),
('What part of a dog''s body contains its sweat glands?', '["Paw pads", "Nose", "Ears", "Tongue"]', 0, 'Animals', 'medium', 15, 25),
('Which fast-running bird is the closest living relative to the Tyrannosaurus Rex?', '["Ostrich", "Emu", "Cassowary", "Rhea"]', 0, 'Animals', 'medium', 15, 25),
('What do you call a group of crows?', '["A murder", "A flock", "A murder", "A murder"]', 0, 'Animals', 'medium', 15, 25),
('Which animal is the national animal of Scotland?', '["Unicorn", "Lion", "Eagle", "Stag"]', 0, 'Animals', 'medium', 15, 25),
('What is the collective noun for a group of rhinoceroses?', '["A crash", "A herd", "A pride", "A pack"]', 0, 'Animals', 'medium', 15, 25),
('How many teeth does a great white shark typically grow throughout its lifetime?', '["Around 30,000", "Around 3,000", "Around 300", "Around 30"]', 0, 'Animals', 'medium', 15, 25),
('Which creature is capable of regenerating lost limbs, including its brain and spinal cord?', '["Axolotl (or a starfish)", "Lizard", "Salamander", "Newt"]', 0, 'Animals', 'medium', 15, 25),
('What color is a giraffe''s tongue?', '["Blue or purplish-black", "Pink", "Red", "Green"]', 0, 'Animals', 'medium', 15, 25),
('Which animal has the largest eyes of any animal on Earth?', '["Colossal squid", "Giant squid", "Blue whale", "Elephant"]', 0, 'Animals', 'medium', 15, 25),
('How many stomachs does a cow have?', '["One stomach with four compartments", "Four separate stomachs", "Two stomachs", "Three stomachs"]', 0, 'Animals', 'medium', 15, 25),
('What are baby rabbits called?', '["Kits or kittens", "Pups", "Cubs", "Lambs"]', 0, 'Animals', 'medium', 15, 25),
('The mantis shrimp can punch as fast as what projectile?', '["A bullet", "A baseball", "A tennis ball", "A golf ball"]', 0, 'Animals', 'medium', 15, 25),
('What is a female peacock called?', '["Peahen", "Peacock", "Peachick", "Peafowl"]', 0, 'Animals', 'medium', 15, 25),
('Which animal has a highly sensitive nose that can detect electric fields underwater?', '["Star-nosed mole", "Duck-billed platypus", "Echidna", "Aardvark"]', 0, 'Animals', 'medium', 15, 25),
('What is the only known mammal to have scales (made of keratin)?', '["Pangolin", "Armadillo", "Hedgehog", "Porcupine"]', 0, 'Animals', 'medium', 15, 25),
('What is the maximum number of degrees an owl can rotate its head?', '["270 degrees", "180 degrees", "360 degrees", "90 degrees"]', 0, 'Animals', 'medium', 15, 25),
('Which snake is considered the most venomous in the world?', '["Inland taipan", "Black mamba", "King cobra", "Rattlesnake"]', 0, 'Animals', 'medium', 15, 25),
('What is the primary reason frogs croak?', '["To attract a mate (or establish territory)", "To warn of danger", "To communicate with young", "To mark territory"]', 0, 'Animals', 'medium', 15, 25),
('Which animal uses its claws to communicate?', '["Crabs", "Lobsters", "Shrimp", "Crayfish"]', 0, 'Animals', 'medium', 15, 25),
('True or False: Alligators can stay underwater for up to 24 hours.', '["True (but only by entering a state of dormancy)", "False", "Only in winter", "Only when sleeping"]', 0, 'Animals', 'medium', 15, 25),
('Which animal is the largest rodent?', '["Capybara", "Beaver", "Porcupine", "Marmot"]', 0, 'Animals', 'medium', 15, 25),
('What do you call the process where a snake sheds its skin?', '["Ecdysis", "Molting", "Shedding", "Sloughing"]', 0, 'Animals', 'medium', 15, 25),
('What is the scientific name for the common house cat?', '["Felis catus", "Felis domesticus", "Felis silvestris", "Felis lybica"]', 0, 'Animals', 'medium', 15, 25),
('Which marine creature is believed to never die of old age?', '["Turritopsis dohrnii (the immortal jellyfish)", "Lobster", "Whale", "Shark"]', 0, 'Animals', 'medium', 15, 25),
('What is a group of ferrets called?', '["A business", "A pack", "A herd", "A colony"]', 0, 'Animals', 'medium', 15, 25),
('Which bird has a brain smaller than its eye?', '["Ostrich", "Emu", "Kiwi", "Penguin"]', 0, 'Animals', 'medium', 15, 25),
('Which domestic animal has pupils that are rectangular?', '["Goat", "Sheep", "Horse", "Cow"]', 0, 'Animals', 'medium', 15, 25),
('What is the main difference between a Dromedary camel and a Bactrian camel?', '["Dromedary has one hump, Bactrian has two", "Dromedary has two humps, Bactrian has one", "Dromedary is larger", "Bactrian is faster"]', 0, 'Animals', 'medium', 15, 25),
('Which creature can make a sound louder than a jet engine?', '["Pistol shrimp (or snapping shrimp)", "Whale", "Lion", "Elephant"]', 0, 'Animals', 'medium', 15, 25),
('Which mammal is born with soft horns that harden with age?', '["Giraffe", "Antelope", "Deer", "Moose"]', 0, 'Animals', 'medium', 15, 25),
('What is the fastest marine animal?', '["Sailfish", "Dolphin", "Shark", "Tuna"]', 0, 'Animals', 'medium', 15, 25),
('Which animal is often nicknamed the "Black Death" in Africa due to its unpredictable and dangerous nature?', '["Cape buffalo", "Lion", "Hippo", "Rhino"]', 0, 'Animals', 'medium', 15, 25),
('What type of animal is a tuatara, which is only found in New Zealand?', '["Reptile (though often mistaken for a lizard)", "Lizard", "Amphibian", "Mammal"]', 0, 'Animals', 'medium', 15, 25),
('What is the maximum number of times a honeybee can sting?', '["One (male drones don''t sting, and the worker bee dies after stinging)", "Multiple times", "Three times", "Five times"]', 0, 'Animals', 'medium', 15, 25),
('What is the most common way a frog drinks water?', '["Absorbing it through its skin", "Drinking with its mouth", "Through its nose", "Through its feet"]', 0, 'Animals', 'medium', 15, 25),
('What common animal is the closest living relative to the hippopotamus?', '["Whale", "Dolphin", "Pig", "Cow"]', 0, 'Animals', 'medium', 15, 25);

-- Insert Animal Questions (Hard - 20 questions)
INSERT INTO public.trivia_questions (question, options, correct_answer, category, difficulty, points, time_limit) VALUES
-- Hard Animal Questions
('What is the scientific name for the animal whose name translates to "earth pig"?', '["Orycteropus afer (Aardvark)", "Sus scrofa (Pig)", "Dasypus novemcinctus (Armadillo)", "Erethizon dorsatum (Porcupine)"]', 0, 'Animals', 'hard', 20, 20),
('Which marine animal is known for its ability to produce bioluminescent slime as a defense mechanism?', '["Hagfish", "Jellyfish", "Anglerfish", "Lanternfish"]', 0, 'Animals', 'hard', 20, 20),
('What bird is famous for building a ''bower'' decorated with bright objects to attract a mate?', '["Bowerbird", "Bird of paradise", "Peacock", "Lyrebird"]', 0, 'Animals', 'hard', 20, 20),
('Which species of bear is the smallest in the world?', '["Sun bear", "Panda bear", "Sloth bear", "Spectacled bear"]', 0, 'Animals', 'hard', 20, 20),
('What is the only North American marsupial?', '["Opossum (Virginia Opossum)", "Kangaroo", "Koala", "Wombat"]', 0, 'Animals', 'hard', 20, 20),
('The horn of a narwhal is actually what part of its body?', '["An elongated tooth (tusk)", "A horn", "A bone", "A fin"]', 0, 'Animals', 'hard', 20, 20),
('What group of animals is collectively known as an "unkindness"?', '["Ravens", "Crows", "Magpies", "Jays"]', 0, 'Animals', 'hard', 20, 20),
('How long can a snail potentially sleep for?', '["Three years", "One year", "Six months", "Two years"]', 0, 'Animals', 'hard', 20, 20),
('What is the estimated number of flowers a honeybee must visit to produce one pound of honey?', '["About 2 million", "About 200,000", "About 20,000", "About 2,000"]', 0, 'Animals', 'hard', 20, 20),
('Which animal is known to plant thousands of trees by burying nuts and seeds and forgetting about them?', '["Squirrel", "Chipmunk", "Mouse", "Hamster"]', 0, 'Animals', 'hard', 20, 20),
('What animal has the most powerful bite force of any living species?', '["Saltwater crocodile", "Great white shark", "Hippopotamus", "Jaguar"]', 0, 'Animals', 'hard', 20, 20),
('What is the collective noun for a group of hedgehogs?', '["An array", "A prickle", "A herd", "A pack"]', 0, 'Animals', 'hard', 20, 20),
('Which animal possesses the densest fur of any creature?', '["Sea otter", "Beaver", "Mink", "Chinchilla"]', 0, 'Animals', 'hard', 20, 20),
('What are the two egg-laying mammals (monotremes) native to Australia?', '["Platypus and Echidna", "Kangaroo and Koala", "Wombat and Tasmanian Devil", "Bandicoot and Bilby"]', 0, 'Animals', 'hard', 20, 20),
('What species of marine mammal is known for having a unique whistle that acts as a name for each individual?', '["Dolphin (Bottlenose dolphins)", "Whale", "Seal", "Manatee"]', 0, 'Animals', 'hard', 20, 20),
('What material makes up a rattlesnake''s rattle?', '["Keratin", "Bone", "Cartilage", "Hair"]', 0, 'Animals', 'hard', 20, 20),
('What is the largest species of penguin?', '["Emperor penguin", "King penguin", "Adélie penguin", "Chinstrap penguin"]', 0, 'Animals', 'hard', 20, 20),
('Which cephalopod is known for having eight arms and two longer tentacles?', '["Squid", "Octopus", "Cuttlefish", "Nautilus"]', 0, 'Animals', 'hard', 20, 20),
('Which animal is invisible when seen through infrared cameras?', '["Polar bear (due to its excellent insulation that keeps heat in)", "Arctic fox", "Snow leopard", "Arctic hare"]', 0, 'Animals', 'hard', 20, 20),
('What is the process called where an animal suspends its metabolism in response to hot, dry conditions?', '["Estivation (or aestivation)", "Hibernation", "Torpor", "Dormancy"]', 0, 'Animals', 'hard', 20, 20);

-- Insert Multiplication Questions (1-15 tables)
-- 1's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(1, 1, 1, 'easy', 15, 10), (1, 2, 2, 'easy', 15, 10), (1, 3, 3, 'easy', 15, 10), (1, 4, 4, 'easy', 15, 10), (1, 5, 5, 'easy', 15, 10),
(1, 6, 6, 'easy', 15, 10), (1, 7, 7, 'easy', 15, 10), (1, 8, 8, 'easy', 15, 10), (1, 9, 9, 'easy', 15, 10), (1, 10, 10, 'easy', 15, 10),
(1, 11, 11, 'easy', 15, 10), (1, 12, 12, 'easy', 15, 10), (1, 13, 13, 'easy', 15, 10);

-- 2's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(2, 1, 2, 'easy', 15, 10), (2, 2, 4, 'easy', 15, 10), (2, 3, 6, 'easy', 15, 10), (2, 4, 8, 'easy', 15, 10), (2, 5, 10, 'easy', 15, 10),
(2, 6, 12, 'easy', 15, 10), (2, 7, 14, 'easy', 15, 10), (2, 8, 16, 'easy', 15, 10), (2, 9, 18, 'easy', 15, 10), (2, 10, 20, 'easy', 15, 10),
(2, 11, 22, 'easy', 15, 10), (2, 12, 24, 'easy', 15, 10), (2, 13, 26, 'easy', 15, 10);

-- 3's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(3, 1, 3, 'easy', 15, 10), (3, 2, 6, 'easy', 15, 10), (3, 3, 9, 'easy', 15, 10), (3, 4, 12, 'easy', 15, 10), (3, 5, 15, 'easy', 15, 10),
(3, 6, 18, 'easy', 15, 10), (3, 7, 21, 'easy', 15, 10), (3, 8, 24, 'easy', 15, 10), (3, 9, 27, 'easy', 15, 10), (3, 10, 30, 'easy', 15, 10),
(3, 11, 33, 'easy', 15, 10), (3, 12, 36, 'easy', 15, 10), (3, 13, 39, 'easy', 15, 10);

-- 4's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(4, 1, 4, 'easy', 15, 10), (4, 2, 8, 'easy', 15, 10), (4, 3, 12, 'easy', 15, 10), (4, 4, 16, 'easy', 15, 10), (4, 5, 20, 'easy', 15, 10),
(4, 6, 24, 'easy', 15, 10), (4, 7, 28, 'easy', 15, 10), (4, 8, 32, 'easy', 15, 10), (4, 9, 36, 'easy', 15, 10), (4, 10, 40, 'easy', 15, 10),
(4, 11, 44, 'easy', 15, 10), (4, 12, 48, 'easy', 15, 10), (4, 13, 52, 'easy', 15, 10);

-- 5's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(5, 1, 5, 'easy', 15, 10), (5, 2, 10, 'easy', 15, 10), (5, 3, 15, 'easy', 15, 10), (5, 4, 20, 'easy', 15, 10), (5, 5, 25, 'easy', 15, 10),
(5, 6, 30, 'easy', 15, 10), (5, 7, 35, 'easy', 15, 10), (5, 8, 40, 'easy', 15, 10), (5, 9, 45, 'easy', 15, 10), (5, 10, 50, 'easy', 15, 10),
(5, 11, 55, 'easy', 15, 10), (5, 12, 60, 'easy', 15, 10), (5, 13, 65, 'easy', 15, 10);

-- 6's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(6, 1, 6, 'easy', 15, 10), (6, 2, 12, 'easy', 15, 10), (6, 3, 18, 'easy', 15, 10), (6, 4, 24, 'easy', 15, 10), (6, 5, 30, 'easy', 15, 10),
(6, 6, 36, 'easy', 15, 10), (6, 7, 42, 'easy', 15, 10), (6, 8, 48, 'easy', 15, 10), (6, 9, 54, 'easy', 15, 10), (6, 10, 60, 'easy', 15, 10),
(6, 11, 66, 'easy', 15, 10), (6, 12, 72, 'easy', 15, 10), (6, 13, 78, 'easy', 15, 10);

-- 7's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(7, 1, 7, 'medium', 12, 15), (7, 2, 14, 'medium', 12, 15), (7, 3, 21, 'medium', 12, 15), (7, 4, 28, 'medium', 12, 15), (7, 5, 35, 'medium', 12, 15),
(7, 6, 42, 'medium', 12, 15), (7, 7, 49, 'medium', 12, 15), (7, 8, 56, 'medium', 12, 15), (7, 9, 63, 'medium', 12, 15), (7, 10, 70, 'medium', 12, 15),
(7, 11, 77, 'medium', 12, 15), (7, 12, 84, 'medium', 12, 15), (7, 13, 91, 'medium', 12, 15);

-- 8's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(8, 1, 8, 'medium', 12, 15), (8, 2, 16, 'medium', 12, 15), (8, 3, 24, 'medium', 12, 15), (8, 4, 32, 'medium', 12, 15), (8, 5, 40, 'medium', 12, 15),
(8, 6, 48, 'medium', 12, 15), (8, 7, 56, 'medium', 12, 15), (8, 8, 64, 'medium', 12, 15), (8, 9, 72, 'medium', 12, 15), (8, 10, 80, 'medium', 12, 15),
(8, 11, 88, 'medium', 12, 15), (8, 12, 96, 'medium', 12, 15), (8, 13, 104, 'medium', 12, 15);

-- 9's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(9, 1, 9, 'medium', 12, 15), (9, 2, 18, 'medium', 12, 15), (9, 3, 27, 'medium', 12, 15), (9, 4, 36, 'medium', 12, 15), (9, 5, 45, 'medium', 12, 15),
(9, 6, 54, 'medium', 12, 15), (9, 7, 63, 'medium', 12, 15), (9, 8, 72, 'medium', 12, 15), (9, 9, 81, 'medium', 12, 15), (9, 10, 90, 'medium', 12, 15),
(9, 11, 99, 'medium', 12, 15), (9, 12, 108, 'medium', 12, 15), (9, 13, 117, 'medium', 12, 15);

-- 10's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(10, 1, 10, 'medium', 12, 15), (10, 2, 20, 'medium', 12, 15), (10, 3, 30, 'medium', 12, 15), (10, 4, 40, 'medium', 12, 15), (10, 5, 50, 'medium', 12, 15),
(10, 6, 60, 'medium', 12, 15), (10, 7, 70, 'medium', 12, 15), (10, 8, 80, 'medium', 12, 15), (10, 9, 90, 'medium', 12, 15), (10, 10, 100, 'medium', 12, 15),
(10, 11, 110, 'medium', 12, 15), (10, 12, 120, 'medium', 12, 15), (10, 13, 130, 'medium', 12, 15);

-- 11's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(11, 1, 11, 'medium', 12, 15), (11, 2, 22, 'medium', 12, 15), (11, 3, 33, 'medium', 12, 15), (11, 4, 44, 'medium', 12, 15), (11, 5, 55, 'medium', 12, 15),
(11, 6, 66, 'medium', 12, 15), (11, 7, 77, 'medium', 12, 15), (11, 8, 88, 'medium', 12, 15), (11, 9, 99, 'medium', 12, 15), (11, 10, 110, 'medium', 12, 15),
(11, 11, 121, 'medium', 12, 15), (11, 12, 132, 'medium', 12, 15), (11, 13, 143, 'medium', 12, 15);

-- 12's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(12, 1, 12, 'medium', 12, 15), (12, 2, 24, 'medium', 12, 15), (12, 3, 36, 'medium', 12, 15), (12, 4, 48, 'medium', 12, 15), (12, 5, 60, 'medium', 12, 15),
(12, 6, 72, 'medium', 12, 15), (12, 7, 84, 'medium', 12, 15), (12, 8, 96, 'medium', 12, 15), (12, 9, 108, 'medium', 12, 15), (12, 10, 120, 'medium', 12, 15),
(12, 11, 132, 'medium', 12, 15), (12, 12, 144, 'medium', 12, 15), (12, 13, 156, 'medium', 12, 15);

-- 13's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(13, 1, 13, 'hard', 10, 20), (13, 2, 26, 'hard', 10, 20), (13, 3, 39, 'hard', 10, 20), (13, 4, 52, 'hard', 10, 20), (13, 5, 65, 'hard', 10, 20),
(13, 6, 78, 'hard', 10, 20), (13, 7, 91, 'hard', 10, 20), (13, 8, 104, 'hard', 10, 20), (13, 9, 117, 'hard', 10, 20), (13, 10, 130, 'hard', 10, 20),
(13, 11, 143, 'hard', 10, 20), (13, 12, 156, 'hard', 10, 20), (13, 13, 169, 'hard', 10, 20);

-- 14's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(14, 1, 14, 'hard', 10, 20), (14, 2, 28, 'hard', 10, 20), (14, 3, 42, 'hard', 10, 20), (14, 4, 56, 'hard', 10, 20), (14, 5, 70, 'hard', 10, 20),
(14, 6, 84, 'hard', 10, 20), (14, 7, 98, 'hard', 10, 20), (14, 8, 112, 'hard', 10, 20), (14, 9, 126, 'hard', 10, 20), (14, 10, 140, 'hard', 10, 20),
(14, 11, 154, 'hard', 10, 20), (14, 12, 168, 'hard', 10, 20), (14, 13, 182, 'hard', 10, 20);

-- 15's Table
INSERT INTO public.multiplication_questions (factor1, factor2, product, difficulty, time_limit, points) VALUES
(15, 1, 15, 'hard', 10, 20), (15, 2, 30, 'hard', 10, 20), (15, 3, 45, 'hard', 10, 20), (15, 4, 60, 'hard', 10, 20), (15, 5, 75, 'hard', 10, 20),
(15, 6, 90, 'hard', 10, 20), (15, 7, 105, 'hard', 10, 20), (15, 8, 120, 'hard', 10, 20), (15, 9, 135, 'hard', 10, 20), (15, 10, 150, 'hard', 10, 20),
(15, 11, 165, 'hard', 10, 20), (15, 12, 180, 'hard', 10, 20), (15, 13, 195, 'hard', 10, 20);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trivia_questions_category_difficulty ON public.trivia_questions(category, difficulty);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_difficulty ON public.trivia_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_multiplication_questions_difficulty ON public.multiplication_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_multiplication_questions_factors ON public.multiplication_questions(factor1, factor2);

-- Enable Row Level Security
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplication_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (read-only for questions)
CREATE POLICY "Allow public read access to trivia questions" ON public.trivia_questions
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to multiplication questions" ON public.multiplication_questions
  FOR SELECT USING (true);
