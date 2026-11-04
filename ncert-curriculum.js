/* LearnFlex — CBSE 2026–27 / NCERT chapter catalog.
 * Chapter titles are mapped from current NCERT textbook contents/catalogues.
 * Practice items are original learning checks, not copied NCERT questions.
 * Language options are limited to the CBSE/NCERT textbook catalogue; no state-board content is included.
 * Arts, PE and Vocational areas are activity modules, not falsely presented as textbook chapters.
 */
(function(root){
 const pack=root.LEARNFLEX_CURRICULUM;
 if(!pack) throw new Error('Load curriculum.js before NCERT curriculum');
 const books={
  6:{
   'Mathematics':{book:'Ganita Prakash',source:'NCERT 2026–27',chapters:['Patterns in Mathematics','Lines and Angles','Number Play','Data Handling and Presentation','Prime Time','Perimeter and Area','Fractions','Playing with Constructions','Symmetry','The Other Side of Zero']},
   'Science':{book:'Curiosity',source:'NCERT 2026–27',chapters:['The Wonderful World of Science','Diversity in the Living World','Mindful Eating: A Path to a Healthy Body','Exploring Magnets','Measurement of Length and Motion','Materials Around Us','Temperature and Its Measurement','A Journey through States of Water','Methods of Separation in Everyday Life','Living Creatures: Exploring their Characteristics','Nature’s Treasures','Beyond Earth']},
   'Social Studies':{book:'Exploring Society: India and Beyond',source:'NCERT 2026–27',chapters:['Locating Places on the Earth','Oceans and Continents','Landforms and Life','Timeline and Sources of History','India, That Is Bharat','The Beginnings of Indian Civilisation','India’s Cultural Roots','Unity in Diversity: Many in the One','Family and Community','Grassroots Democracy – Part 1: Governance','Grassroots Democracy – Part 2: Local Government in Rural Areas','Grassroots Democracy – Part 3: Local Government in Urban Areas','The Value of Work','Economic Activities Around Us']},
   'English':{book:'Poorvi',source:'NCERT 2026–27',chapters:['Fables and Folk Tales','Friendship','Nurturing Nature','Sports and Wellness','Culture and Tradition']},
   'Hindi':{book:'Malhar',source:'NCERT 2026–27',chapters:['मातृभूमि','गोल','पहली बूँद','हार की जीत','रहीम के दोहे','मेरी माँ','जलाते चलो','सत्रिया और बिहू नृत्य','मैया मैं नहीं माखन खायो','परीक्षा','चेतक की वीरता','हिंद महासागर में छोटा-सा हिंदुस्तान','पेड़ की बात']},
   'Sanskrit':{book:'Deepakam',source:'NCERT 2026–27',chapters:['वयं वर्णमालां पठामः','संयुक्त-व्यञ्जनानि','एषः कः? एषा का? एतत् किम्?','अहं च त्वं च','संख्यागणना ननु सरला','अहं प्रातः उत्तिष्ठामि','शूराः वयं धीराः वयम्','सः एव महान् चित्रकारः','अतिथिदेवो भव','बुद्धिः सर्वार्थसाधिका','यः जानाति सः पण्डितः','त्वम् आपणं गच्छ','पृथिव्यां त्रीणि रत्नानि','आलस्यं हि मनुष्याणां शरीरस्थः महान् रिपुः','माधवस्य प्रियम् अङ्गम्','वृक्षाः सत्पुरुषाः इव']},
  },
  7:{
   'Mathematics':{book:'Ganita Prakash',source:'NCERT 2026–27',chapters:['Large Numbers Around Us','Arithmetic Expressions','A Peek Beyond the Point','Expressions Using Letter-Numbers','Parallel and Intersecting Lines','Number Play','A Tale of Three Intersecting Lines','Working with Fractions']},
   'Science':{book:'Curiosity',source:'NCERT 2026–27',chapters:['The Ever-Evolving World of Science','Exploring Substances: Acidic, Basic, and Neutral','Electricity: Circuits and Their Components','The World of Metals and Non-metals','Changes Around Us: Physical and Chemical','Adolescence: A Stage of Growth and Change','Heat Transfer in Nature','Measurement of Time and Motion','Life Processes in Animals','Life Processes in Plants','Light: Shadows and Reflections','Earth, Moon, and the Sun']},
   'Social Studies':{book:'Exploring Society: India and Beyond, Parts I–II',source:'NCERT 2026–27',chapters:['Geographical Diversity of India','Understanding the Weather','Climates of India','New Beginnings: Cities and States','The Rise of Empires','The Age of Reorganisation','The Gupta Era: An Age of Tireless Creativity','How the Land Becomes Sacred','From the Rulers to the Ruled: Types of Governments','The Constitution of India — An Introduction','From Barter to Money','Understanding Markets','The Story of Indian Farming','India and Her Neighbours','Empires and Kingdoms: 6th to 10th Centuries','Turning Tides: 11th and 12th Centuries','India, a Home to Many','The State, the Government, and You','Infrastructure: Engine of India’s Development','Banks and the Magic of Finance']},
   'English':{book:'Poorvi',source:'NCERT 2026–27',chapters:['Learning Together','Wit and Humour','Dreams and Discoveries','Travel and Adventure','Bravehearts']},
   'Hindi':{book:'Malhar',source:'NCERT 2026–27',chapters:['माँ, कह एक कहानी','तीन बुद्धिमान','फूल और काँटा','पानी रे पानी','नहीं होना बीमार','गिरिधर कविराय की कुंडलियाँ','वर्षा-बहार','बिरजू महाराज से साक्षात्कार','चिड़िया','मीरा के पद']},
   'Sanskrit':{book:'Deepakam',source:'NCERT 2026–27',chapters:['वन्दे भारतमातरम्','नित्यं पिबामः सुभाषितरसम्','मित्राय नमः','न लभ्यते चेत् आम्लं द्राक्षाफलम्','सेवा हि परमो धर्मः','क्रीडाम वयं श्लोकान्त्याक्षरीम्','ईशावास्यम् इदं सर्वम्','हितं मनोहारि च दुर्लभं वचः','अन्नाद् भवन्ति भूतानि','दशमः कः?','द्वीपेषु रम्यः द्वीपोऽण्डमानः','वीराङ्गना पन्नाधाया','अतिरिक्तम् अध्ययनम्: वर्णमात्रा-परिचयः','परिशिष्टम्: शब्दरूपाणि','परिशिष्टम्: धातुरूपाणि']},
  },
  8:{
   'Mathematics':{book:'Ganita Prakash, Parts I–II',source:'NCERT 2026–27',chapters:['A Square and a Cube','Power Play','A Story of Numbers','Quadrilaterals','Number Play','We Distribute, Yet Things Multiply','Proportional Reasoning–1','Fractions in Disguise','The Baudhāyana-Pythagoras Theorem','Proportional Reasoning–2','Exploring Some Geometric Themes','Tales by Dots and Lines','Algebra Play','Area']},
   'Science':{book:'Curiosity',source:'NCERT 2026–27',chapters:['Exploring the Investigative World of Science','The Invisible Living World: Beyond Our Naked Eye','Health: The Ultimate Treasure','Electricity: Magnetic and Heating Effects','Exploring Forces','Pressure, Winds, Storms and Cyclones','Particulate Nature of Matter','Nature of Matter: Elements, Compounds, and Mixtures','The Amazing World of Solutes, Solvents and Solutions','Light: Mirrors and Lenses','Keeping Time with the Skies','How Nature Works in Harmony','Our Home: Earth, a Unique Life-Sustaining Planet']},
   'Social Studies':{book:'Exploring Society: India and Beyond, Parts I–II',source:'NCERT 2026–27',chapters:['Natural Resources and Their Use','Reshaping India’s Political Map','The Rise of the Marathas','The Colonial Era in India','Universal Franchise and India’s Electoral System','The Parliamentary System: Legislature and Executive','Factors of Production','World Geography: Some Glimpses','India’s Long Road to Independence','A Journey through Indian Architecture','The Role of the Judiciary in Our Society','Citizenship: Rights and Duties','Dynamics of Population','India’s Urban Landscape','Cultural Currents: 13th to 17th Centuries']},
   'English':{book:'Poorvi',source:'NCERT 2026–27',chapters:['Wit and Wisdom','Values and Dispositions','Mystery and Magic','Environment','Science and Curiosity']},
   'Hindi':{book:'Malhar',source:'NCERT 2026–27',chapters:['स्वदेश','दो गौरैया','एक आशीर्वाद','हरिहर','कबीर के दोहे','एक टोकरी भर मिट्टी','मत बाँधो','नए मेहमान','आदमी का अनुपात','तरुण के स्वप्न']},
   'Sanskrit':{book:'Deepakam',source:'NCERT 2026–27',chapters:['संगच्छध्वं संवदध्वम्','अल्पानामपि वस्तूनां संहतिः कार्यसाधिका','सुभाषितरसं पीत्वा जीवनं सफलं कुरु','प्रणम्यो देशभक्तोऽयं गोपबन्धुर्महामनाः','गीता सुगीता कर्तव्या','डिजिभारतम् – युगपरिवर्तनम्','मञ्जुलमञ्जूषा सुन्दरसुरभाषा','पश्यत कोणमैशान्यं भारतस्य मनोहरम्','कोऽरुक्? कोऽरुक्? कोऽरुक्?','सन्निमित्ते वरं त्यागः (क-भागः)','सन्निमित्ते वरं त्यागः (ख-भागः)','सम्यग्वर्णप्रयोगेण ब्रह्मलोके महीयते','वर्णोच्चारण-शिक्षा','परिशिष्टम्: व्याकरणम्','परिशिष्टम्: शब्दरूपाणि','परिशिष्टम्: धातुरूपाणि']},
  },
  9:{
   'Mathematics':{book:'Ganita Manjari, Parts I–II',source:'NCERT 2026–27',chapters:['Orienting Yourself: The Use of Coordinates','Introduction to Linear Polynomials','The World of Numbers','Exploring Algebraic Identities','I’m Up and Down, and Round and Round','Measuring Space: Perimeter and Area','The Mathematics of Maybe: Introduction to Probability','Predicting What Comes Next: Exploring Sequences and Progressions','Propositions and Proofs','Data: Collection, Representation and Interpretation','Algorithms and Flowcharts','Quadrilaterals','Linear Equations in Two Variables','Surface Areas and Volumes']},
   'Science':{book:'Exploration',source:'NCERT 2026–27',chapters:['Exploration: Entering the World of Secondary Science','Cell: The Building Block of Life','Tissues in Action','Describing Motion Around Us','Exploring Mixtures and Their Separation','How Forces Affect Motion','Work, Energy and Simple Machines','Journey Inside the Atom','Atomic Foundations of Matter','Sound Waves: Characteristics and Applications','Reproduction: How Life Continues','Patterns in Life: Diversity and Classification','Earth as a System: Energy, Matter and Life']},
   'Social Studies':{book:'Understanding Society: India and Beyond, Parts I–II',source:'NCERT 2026–27',chapters:['Understanding Social Science','Shaping of the Earth’s Surface','Atmosphere and Climate','Early Humans and Beginning of Civilisation','State and Society up to 1000 CE','Democracy','Elections','Building Blocks in Economics: The Problem of Choice','The Price Puzzle: What Drives the Market','Oceans and Life','Life on Earth','Resistance and Resilience (1000–1700 CE)','Governance and Public Policy','Managing Your Personal Finances','From Ideas to Startups']},
   'English':{book:'Kaveri',source:'NCERT 2026–27',chapters:['How I Taught My Grandmother to Read; Bharat Our Land','The Pot Maker; Gifts of Grace: Honouring Our Vocations','Winds of Change; Canvas of Soil','Vitamin-M; I Cannot Remember My Mother','The World of Limitless Possibilities; Nine Gold Medals','Twin Melodies; A Friend Found in Music','Carrier of Words; Words','Follow That Dream; Believe in Yourself']},
   'Hindi':{book:'Ganga',source:'NCERT 2026–27',chapters:['दो बैलों की कथा','क्या लिखूँ?','संवादहीन','ऐसी भी बातें होती हैं','आखिरी चट्टान तक','रीढ़ की हड्डी','मैं और मेरा देश','रैदास के पद','राम-लक्ष्मण-परशुराम संवाद','भारती, जय, विजय करे','झाँसी की रानी','घर की याद']},
   'Sanskrit':{book:'Sharada',source:'NCERT 2026–27',chapters:['सत्यं शिवं सुन्दरं संस्कृतम्','सुखस्य मूलं धर्मः धर्मस्य मूलम् अर्थः','आत्मवत्सर्वभूतेषु यः पश्यति सः पण्डितः','न खलु वयस्तेजसो हेतुः','एषा सा कृतकबुद्धिः मानवबुद्धेः सहकरी','मनःपूतं समाचरेत्','उपायं चिन्तयेत् प्राज्ञस्तथापायं च चिन्तयेत्','अन्नाद् आनन्दं प्रति','कृतं प्रतिकृतं भूयादेष धर्मः सनातनः','णमो अरिहन्ताणम्','वर्णोच्चारण-शिक्षा २','परिशिष्टम्: अन्वयः','परिशिष्टम्: समासः','परिशिष्टम्: वाच्यम्','परिशिष्टम्: शब्दरूपाणि','परिशिष्टम्: धातुरूपाणि']},
  },
  10:{
   'Mathematics':{book:'Mathematics',source:'NCERT 2025–26 textbook edition currently used in Class 10',chapters:['Real Numbers','Polynomials','Pair of Linear Equations in Two Variables','Quadratic Equations','Arithmetic Progressions','Triangles','Coordinate Geometry','Introduction to Trigonometry','Some Applications of Trigonometry','Circles','Areas Related to Circles','Surface Areas and Volumes','Statistics','Probability']},
   'Science':{book:'Science',source:'NCERT 2025–26 textbook edition currently used in Class 10',chapters:['Chemical Reactions and Equations','Acids, Bases and Salts','Metals and Non-metals','Carbon and Its Compounds','Periodic Classification of Elements','Life Processes','Control and Coordination','How Do Organisms Reproduce?','Heredity and Evolution','Light: Reflection and Refraction','The Human Eye and the Colourful World','Electricity','Magnetic Effects of Electric Current','Sources of Energy','Our Environment','Management of Natural Resources']},
   'Social Studies':{book:'NCERT Social Science books',source:'NCERT Class 10 History, Geography, Political Science and Economics books',chapters:['Resources and Development','Forest and Wildlife Resources','Water Resources','Agriculture','Minerals and Energy Resources','Manufacturing Industries','Lifelines of National Economy','The Rise of Nationalism in Europe','Nationalism in India','The Making of a Global World','The Age of Industrialisation','Print Culture and the Modern World','Power-sharing','Federalism','Gender, Religion and Caste','Political Parties','Outcomes of Democracy','Development','Sectors of the Indian Economy','Money and Credit','Globalisation and the Indian Economy','Consumer Rights']},
   'English':{book:'First Flight and Footprints Without Feet',source:'NCERT Class 10 English prescribed texts; prose, poetry and supplementary reader',chapters:['A Letter to God','Nelson Mandela: Long Walk to Freedom','Two Stories about Flying','From the Diary of Anne Frank','Glimpses of India','Mijbil the Otter','Madam Rides the Bus','The Sermon at Benares','The Proposal','Dust of Snow','Fire and Ice','A Tiger in the Zoo','How to Tell Wild Animals','The Ball Poem','Amanda!','The Trees','Fog','The Tale of Custard the Dragon','For Anne Gregory','A Triumph of Surgery','The Thief’s Story','The Midnight Visitor','A Question of Trust','Footprints Without Feet','The Making of a Scientist','The Necklace','Bholi','The Book That Saved the Earth']},
   'Hindi':{book:'Sparsh Bhag II and Sanchayan Bhag II',source:'NCERT Class 10 Hindi course; exact course depends on school',chapters:['साखी','पद','दोहे','मनुष्यता','पर्वत प्रदेश में पावस','मधुर-मधुर मेरे दीपक जल','तोप','कर चले हम फ़िदा','आत्मत्राण','बड़े भाई साहब','डायरी का एक पन्ना','तताँरा-वामीरो कथा','तीसरी कसम के शिल्पकार शैलेंद्र','गिरगिट','अब कहाँ दूसरे के दुख से दुखी होने वाले','पतझर में टूटी पत्तियाँ','कारतूस','हरिहर काका','सपनों के-से दिन','टोपी शुक्ला']},
   'Sanskrit':{book:'Shemushi Bhag II',source:'NCERT Class 10 Sanskrit legacy text; check school course/edition',chapters:['शुचिपर्यावरणम्','बुद्धिर्बलवती सदा','व्यायामः सर्वदा पथ्यः','शिशुलालनम्','जननी तुल्यवत्सला','सुभाषितानि','सौहार्दं प्रकृतेः शोभा','विचित्रः साक्षी','सूक्तयः','भूकम्पविभीषिका','प्राणेभ्योऽपि प्रियः सुहृद्','अन्योक्तयः']},
  }
 };
 const unitContents={
  6:{'Fables and Folk Tales':'A Bottle of Dew; The Raven and the Fox; Rama to the Rescue','Friendship':'The Unlikely Best Friends; A Friend’s Prayer; The Chair','Nurturing Nature':'Neem Baba; What a Bird Thought; Spices That Heal Us','Sports and Wellness':'Change of Heart; The Winner; Yoga—A Way of Life','Culture and Tradition':'Hamara Bharat—Incredible India!; The Kites; Ila Sachani: Embroidering Dreams with her Feet; National War Memorial'},
  7:{'Learning Together':'The Day the River Spoke; Try Again; Three Days to See','Wit and Humour':'Animals, Birds, and Dr. Dolittle; A Funny Man; Say the Right Thing','Dreams and Discoveries':'My Brother’s Great Invention; Paper Boats; North, South, East, West','Travel and Adventure':'The Tunnel; Travel; Conquering the Summit','Bravehearts':'A Homage to Our Brave Soldiers; My Dear Soldiers; Rani Abbakka'},
  8:{'Wit and Wisdom':'The Wit that Won Hearts; A Concrete Example; Wisdom Paves the Way','Values and Dispositions':'A Tale of Valour; Somebody’s Mother; Verghese Kurien','Mystery and Magic':'The Case of the Fifth Word; The Magic Brush of Dreams; Spectacular Wonders','Environment':'The Cherry Tree; Harvest Hymn; Waiting for the Rain','Science and Curiosity':'Feathered Friend; Magnifying Glass; Bibha Chowdhuri'}
 };
 const coCurricular={
  'Arts Education':['Observe and Describe Visual Art','Line, Shape and Form','Colour and Composition','Patterns and Symmetry','Local Art and Craft Traditions','Clay, Paper and Recycled Materials','Visual Storytelling','Music, Rhythm and Movement','Art in Community Life','Portfolio and Reflection'],
  'Physical Education and Well-being':['Movement Skills and Coordination','Fitness and Endurance','Yoga, Breathing and Mindfulness','Team Games and Fair Play','Health, Hygiene and Nutrition','Safety, First Aid and Injury Prevention'],
  'Vocational Education':['Observe a Local Occupation','Tools, Materials and Safety','Plan a Useful Product','Measure, Make and Assemble','Test, Improve and Repair','Sustainable Use of Materials','Work in a Team','Present a Product or Service'],
 };
 const grade10Extra={'Environmental Education':['Ecosystems and Interdependence','Biodiversity and Conservation','Water, Soil and Natural Resources','Climate and Human Activity','Waste, Pollution and Circular Use','Community Action for Sustainability']};
 const oldPackTopics=pack.topics.slice();
 const oldByKey=new Map(oldPackTopics.map(t=>[`${t.grade}|${t.subject}|${String(t.title).toLowerCase()}`,t]));
 const icons={'Mathematics':'∑','Science':'⚛','Social Studies':'⌂','English':'Aa','Hindi':'हि','Sanskrit':'सं','Arts Education':'✎','Physical Education and Well-being':'⚽','Vocational Education':'⚙','Environmental Education':'♻'};
 function summary(subject,title){const t=title.toLowerCase();
  if(subject==='Mathematics'){
   if(/fraction|decimal|number|zero|prime|large numbers|arithmetic|real numbers|data|statistics|probability|maybe|sequence|progression/.test(t))return `This chapter, “${title}”, develops number sense and mathematical reasoning. Identify the quantities and representations, choose an appropriate operation or model, show each step, and check whether the result is reasonable.`;
   if(/line|angle|triangle|quadrilateral|circle|symmetry|construction|coordinate|area|perimeter|surface|volume|shape|geometry/.test(t))return `This chapter, “${title}”, develops spatial reasoning. Use accurate diagrams, labels, relevant geometric properties and units; justify conclusions rather than relying only on appearance.`;
   if(/polynomial|algebra|equation|expression|power|exponent|identity|proportion|ratio|trigonometry/.test(t))return `This chapter, “${title}”, develops algebraic reasoning. Represent unknown quantities with symbols, apply the relevant rule consistently, preserve equality and verify a solution by substitution or an equivalent check.`;
   return `Study “${title}” by identifying the mathematical objects, choosing a suitable representation, explaining the method and checking the answer.`;
  }
  if(subject==='Science'){
   if(/cell|tissue|living|life processes|reproduction|organism|diversity|plant|animal|health|heredity|earth as a system|nature.?s treasures/.test(t))return `This science chapter, “${title}”, concerns living systems and their interactions. Connect structure with function, use observations or diagrams as evidence, and distinguish a supported conclusion from a guess.`;
   if(/matter|substance|mixture|solution|acid|base|metal|carbon|atom|element|chemical|separation/.test(t))return `This science chapter, “${title}”, concerns materials and their properties. Compare observable evidence, identify the substances or particles involved, and explain whether a change is physical or chemical where relevant.`;
   if(/motion|force|energy|electric|magnet|pressure|heat|temperature|light|sound|sky|earth|moon|water|weather|climate/.test(t))return `This science chapter, “${title}”, examines physical phenomena. Use measurements, units, diagrams and controlled observations to explain relationships; support claims with evidence and note how changing conditions affect results.`;
   return `This chapter, “${title}”, develops scientific curiosity and inquiry. Ask a testable question, identify observations or variables, collect evidence fairly, and use the results to explain the phenomenon.`;
  }
  if(subject==='Social Studies'){
   if(/democracy|election|government|constitution|citizenship|judiciary|governance|franchise|state and society|political/.test(t))return `This social-science chapter, “${title}”, explores public institutions and civic life. Identify who makes decisions, what rights or responsibilities apply, and how participation, rules and accountability affect people.`;
   if(/earth|ocean|landform|climate|atmosphere|geograph|resource|water|population|life on earth|farming|urban|environment/.test(t))return `This chapter, “${title}”, explores places, environments and resources. Use maps, spatial patterns and evidence to explain how physical conditions and human activity influence each other.`;
   if(/econom|market|price|money|finance|production|startup|work|industry|choice|infrastructure/.test(t))return `This chapter, “${title}”, explores economic choices and livelihoods. Identify needs, resources, costs, incentives and trade-offs, then use an example or evidence to justify a conclusion.`;
   return `This chapter, “${title}”, studies people, societies and change over time. Use timelines, sources, maps or multiple perspectives to explain causes, continuity, change and consequences.`;
  }
  if(subject==='English')return `In “${title}”, practise the language skills and reading strategies required by the text or unit: understand the main idea, infer meaning from details, examine vocabulary and structure, and support an interpretation with textual evidence.`;
  if(subject==='Hindi')return `“${title}” is a Hindi-language text or unit. Focus on the central भाव/विचार, vocabulary, language features and the meaning supported by the text. Use lines or details from the lesson to justify your interpretation.`;
  if(subject==='Sanskrit')return `“${title}” is a Sanskrit lesson or language unit. Read the passage carefully, identify vocabulary and grammatical forms in context, and use sentence meaning and grammatical clues to support an answer.`;
  if(subject==='Arts Education')return `This arts learning module, “${title}”, develops observation, creative exploration and reflection. Notice visual or performance choices, experiment with materials or techniques safely, and explain the choices made in your work.`;
  if(subject==='Physical Education and Well-being')return `This physical education module, “${title}”, develops safe movement, wellbeing and cooperation. Apply instructions correctly, practise within personal limits, and reflect on health, safety, fairness and teamwork.`;
  if(subject==='Vocational Education')return `This vocational module, “${title}”, develops practical problem-solving. Plan the task, choose suitable tools and materials, follow safety steps, test the result, and improve it using feedback.`;
  return `This module, “${title}”, develops understanding through examples, reflection and practice.`;
 }
 const distractors={
  'Mathematics':['Choose an operation before identifying what the numbers represent.','Treat a diagram as proof even when its measurements or labels do not fit.','Skip the working and accept the first numerical result.'],
  'Science':['Accept a claim without observations or evidence.','Change several conditions at once and assume the cause is known.','Ignore units and repeatability when interpreting a measurement.'],
  'Social Studies':['Use a single unsupported opinion instead of sources or context.','Ignore the role of place, time, institutions or affected groups.','Treat a complex change as having no causes or consequences.'],
  'English':['Guess a character’s motive without checking the text.','Ignore the passage and choose an answer based only on the title.','Treat an interpretation as correct even when textual details contradict it.'],
  'Hindi':['पाठ के प्रमाण के बिना अर्थ का अनुमान लगाएँ।','शब्दों के संदर्भ को न देखकर केवल शीर्षक से उत्तर चुनें।','पाठ के विपरीत अर्थ को भी सही मान लें।'],
  'Sanskrit':['वाक्य के अर्थ और व्याकरण को देखे बिना रूप चुनें।','शब्द को संदर्भ से अलग करके अर्थ तय करें।','लिंग, वचन या विभक्ति के संकेतों को अनदेखा करें।'],
  'Arts Education':['Copy a design without observing or making intentional choices.','Ignore material safety and the effect of the chosen technique.','Judge the work only by whether it looks identical to another work.'],
  'Physical Education and Well-being':['Ignore safety instructions to finish faster.','Treat teamwork and fair play as unrelated to physical activity.','Continue through pain or danger instead of adjusting and seeking help.'],
  'Vocational Education':['Use tools without checking their purpose or safety.','Skip planning and testing, then assume the product will work.','Ignore feedback and refuse to improve the design.'],
  'Environmental Education':['Ignore the links between living things and their environment.','Assume resources are unlimited and waste has no effects.','Suggest an action without considering evidence or practical impact.']
 };
 function approach(subject){return ({'Mathematics':'show a clear method, label quantities and verify the result','Science':'observe carefully, record evidence and explain the result','Social Studies':'compare reliable sources, context and affected perspectives','English':'refer to textual details and explain how they support the interpretation','Hindi':'पाठ के शब्दों/पंक्तियों के आधार पर अर्थ समझाएँ','Sanskrit':'संदर्भ, शब्दरूप और वाक्यरचना के आधार पर उत्तर दें','Arts Education':'observe, experiment with a technique and reflect on intentional choices','Physical Education and Well-being':'follow safe instructions, cooperate and reflect on wellbeing','Vocational Education':'plan, make safely, test the result and improve it','Environmental Education':'use evidence to connect human choices, ecosystems and sustainability'})[subject]||'use evidence and explain your reasoning';}
 function makeQuestion(topic,level,index){
  const summaryText=topic.lesson;
  const wrong=(distractors[topic.subject]||distractors['Social Studies']).slice();
  const approachText=approach(topic.subject);
  const tierPrompts={
   foundation:[
    `Which idea is directly stated in the lesson for “${topic.title}”?`,
    `Which note would help you remember the central idea of “${topic.title}”?`,
    `Which statement matches the basic concept introduced in “${topic.title}”?`,
    `Which description should a learner understand first in “${topic.title}”?`,
    `Which short explanation is supported by the lesson on “${topic.title}”?`
   ],
   reinforcement:[
    `A learner is revising “${topic.title}”. Which explanation connects the key idea to a useful example?`,
    `Which study note would help a learner explain “${topic.title}” in their own words?`,
    `A classmate is unsure about “${topic.title}”. Which explanation should you use to reinforce the idea?`,
    `Which worked-example approach is consistent with the lesson on “${topic.title}”?`,
    `Which explanation best links the main idea in “${topic.title}” to a practical learning step?`
   ],
   standard:[
    `A student must explain the chapter “${topic.title}” using its central method. Which response is supported by the lesson?`,
    `Which response demonstrates grade-level understanding of the chapter “${topic.title}”?`,
    `A learner is asked to justify an answer about “${topic.title}”. Which reasoning is consistent with the chapter?`,
    `Which explanation correctly applies the central idea presented in “${topic.title}”?`,
    `Which answer gives a defensible chapter-based explanation of “${topic.title}”?`
   ],
   challenge:[
    `A new situation requires reasoning from “${topic.title}”. Which approach transfers the chapter's central idea most carefully?`,
    `A learner must defend a conclusion using the ideas in “${topic.title}”. Which response is most evidence-based?`,
    `Which response best extends the reasoning from “${topic.title}” to an unfamiliar example?`,
    `A student is evaluating a complex example related to “${topic.title}”. Which reasoning should guide the analysis?`,
    `Which approach best combines the chapter's central idea with independent verification in “${topic.title}”?`
   ]
  };
  const tierAnswers={
   foundation:summaryText,
   reinforcement:`Begin with the chapter's key idea: ${summaryText}`,
   standard:`Apply the chapter's method accurately: ${summaryText} Then explain the evidence or steps used.`,
   challenge:`Transfer the chapter's reasoning to a new case: ${summaryText} State the relevant evidence or assumptions and check the conclusion.`
  };
  const incorrectBySubject={
   'Mathematics':[
    {label:'Operation chosen before interpreting quantities',why:'The selected approach chooses an operation before identifying what the quantities represent.',action:'Underline the known quantities, state what is being asked, then choose and check an operation.',teacherNext:'Ask the learner to explain what each number represents before calculating.'},
    {label:'Diagram treated as proof without checking properties',why:'A sketch can suggest a result, but labels, measurements and relevant geometric properties must support it.',action:'Mark the given information on a fresh diagram and name the property used.',teacherNext:'Ask the learner to separate what is given from what merely appears true in the drawing.'},
    {label:'Result accepted without showing or checking steps',why:'A numerical result without working cannot be checked for a calculation or reasoning error.',action:'Write each step and use substitution, estimation or an inverse operation to check the result.',teacherNext:'Ask the learner to show the working and perform an independent check.'}
   ],
   'Science':[
    {label:'Claim made without observations or evidence',why:'A scientific explanation needs observations or evidence that can support the claim.',action:'Identify the observation that supports the statement and distinguish it from a guess.',teacherNext:'Ask what evidence would allow another learner to repeat or check the conclusion.'},
    {label:'Several variables changed at once',why:'Changing several conditions together makes it difficult to identify which condition caused the result.',action:'Plan a fair comparison and change one relevant variable at a time.',teacherNext:'Ask the learner to identify the variable changed and the conditions kept the same.'},
    {label:'Measurement interpreted without units or repeatability',why:'A measurement needs suitable units and a repeatable method to be compared reliably.',action:'Record the value with its unit and repeat the observation when appropriate.',teacherNext:'Ask the learner to explain the unit and how the observation could be repeated.'}
   ],
   'English':[
    {label:'Inference not supported by the text',why:'An interpretation should be supported by words, actions or details from the passage.',action:'Return to the relevant lines and identify the textual detail that supports the inference.',teacherNext:'Ask the learner to point to the exact phrase or event supporting the interpretation.'},
    {label:'Answer selected from the title alone',why:'A title gives a clue but does not replace evidence from the passage.',action:'Read the relevant paragraph and compare the answer with its details.',teacherNext:'Ask the learner to cite a supporting sentence from the text.'},
    {label:'Interpretation conflicts with textual details',why:'An answer is not defensible when the passage provides details that contradict it.',action:'Compare the interpretation against the whole passage and revise it where needed.',teacherNext:'Ask the learner to identify evidence both for and against the interpretation.'}
   ]
  };
  const fallbacks=incorrectBySubject[topic.subject]||wrong.map((text,i)=>({label:['Evidence or context not checked','Relevant method not applied','Conclusion not verified'][i],why:`The selected option (“${text}”) does not follow the lesson's evidence-based approach.`,action:`Revisit the key idea in “${topic.title}”, explain your reasoning and try a fresh example.`,teacherNext:'Ask the learner to explain the reasoning behind the selected option before assuming a misconception.'}));
  const correctText=tierAnswers[level]||tierAnswers.standard;
  const options=[correctText,...fallbacks.map(x=>x.label+': '+wrong[fallbacks.indexOf(x)])];
  const answer=(topic.chapterNumber+index+({foundation:0,reinforcement:1,standard:2,challenge:3}[level]))%4;
  const rotated=options.slice();const correctOption=rotated.shift();rotated.splice(answer,0,correctOption);
  const id=`${topic.id}-${level}-${index+1}`;
  const misconceptionByOption={},misconceptions={};
  rotated.forEach((opt,i)=>{
   if(i===answer)return;
   const sourceIndex=wrong.findIndex(text=>opt.endsWith(text));
   const detail=fallbacks[Math.max(0,sourceIndex)]||fallbacks[0];
   const key=`${id}-mis-${i}`;
   misconceptionByOption[i]=key;
   misconceptions[key]={...detail,explanation:`The lesson's supported idea is: ${summaryText}`,followUp:null};
  });
  const explain=`${correctText} This is an original LearnFlex practice draft based on the module lesson and requires subject-teacher review.`;
  const followUp={
   id:`${id}-check`,
   q:`Which explanation of “${topic.title}” is most consistent with the lesson after your review?`,
   options:[summaryText,...wrong],
   answer:0,
   explain:`The lesson explains: ${summaryText}`
  };
  return {id,difficulty:level,q:tierPrompts[level][index%5],options:rotated,answer,explain,misconceptionByOption,misconceptions,followUp,contentStatus:'original-practice-draft-review-required'};
 }

 const topics=[];const coverage=[];const subjectSet=new Set();
 for(let grade=6;grade<=10;grade++){
  const classBooks=books[grade];
  for(const [subject,book] of Object.entries(classBooks)){
   subjectSet.add(subject);const chapterTitles=book.chapters;
   coverage.push({grade,className:`Class ${grade}`,subject,book:book.book,chapters:chapterTitles.length,source:book.source,kind:'textbook'});
   chapterTitles.forEach((title,i)=>{
    const key=`${grade}|${subject}|${title.toLowerCase()}`;const old=oldByKey.get(key);
    const id=(grade===6&&subject==='Mathematics'&&title==='Fractions')?'fractions':`ncert${grade}-${subject.toLowerCase().replace(/[^a-z]+/g,'-')}-${String(i+1).padStart(2,'0')}`;
    const includedTexts=(unitContents[grade]||{})[title]||'';
    const lessonBase=old&&old.lesson?old.lesson:summary(subject,title);
    const lesson=includedTexts?`${lessonBase} This textbook unit includes: ${includedTexts}.`:lessonBase;
    const topic={id,subject,title,description:`${book.source} · Class ${grade} · ${book.book} · Chapter ${i+1}${includedTexts?` · Includes: ${includedTexts}`:''}`,level:i<Math.ceil(chapterTitles.length/3)?'easy':i<Math.ceil(chapterTitles.length*2/3)?'medium':'hard',icon:icons[subject]||'📘',minutes:12,prereq:[],grade,className:`Class ${grade}`,chapter:title,chapterNumber:i+1,bookTitle:book.book,learningOutcome:`Explain the main ideas in “${title}” and apply them in a new example.`,board:'CBSE',academicSession:grade===10?'2025-26/2026-27 legacy textbook':'2026-27',sourceEdition:book.source,alignmentStatus:'CBSE/NCERT chapter-title mapped; original practice items require educator review',sourceUrl:'https://cbseacademic.nic.in/curriculum_2027.html',lesson,example:`Use one example from “${title}” to explain the key idea, then show how your example supports the explanation.`,lessonI18n:{te:{title,lesson:`“${title}” పాఠంలోని ప్రధాన భావాన్ని గుర్తించి, ఆధారం లేదా ఉదాహరణతో వివరించండి. తెలుగు ముసాయిదా — ఉపాధ్యాయ సమీక్ష అవసరం.`,example:`“${title}” భావాన్ని ఒక ఉదాహరణతో వివరించండి.`,steps:['పాఠం చదవండి.','ప్రధాన భావం గుర్తించండి.','ఆధారం లేదా ఉదాహరణ ఎంచుకోండి.','మీ సమాధానాన్ని తనిఖీ చేయండి.'],reviewStatus:'Telugu localization draft — educator review required'},hi:{title,lesson:`“${title}” के मुख्य विचार को पहचानें और पाठ के प्रमाण या उदाहरण से समझाएँ। यह भाषा-पुल मसौदा है; शिक्षक की समीक्षा आवश्यक है।`,example:`“${title}” के विचार को एक उदाहरण से समझाएँ।`,steps:['पाठ पढ़ें।','मुख्य विचार पहचानें।','प्रमाण या उदाहरण चुनें।','उत्तर की जाँच करें।'],reviewStatus:'Hindi localization draft — educator review required'}}};
    const tiers=['foundation','reinforcement','standard','challenge'];topic.questionSets={};
    // Preserve available chapter-matched practice items from the earlier authored prototype
    // for the small set of exact matches (plus the Class 6 fractions module).
    const legacyTopic=oldByKey.get(key)||(id==='fractions'?oldPackTopics.find(item=>item.id==='fractions'):null);
    tiers.forEach(level=>{
      const generated=Array.from({length:5},(_,qIndex)=>makeQuestion(topic,level,qIndex));
      const legacy=legacyTopic?.questionSets?.[level]?.[0];
      if(legacy){generated[0]={...legacy,id:`${topic.id}-${level}-reviewed-source-draft`,difficulty:level,contentStatus:'legacy-original-practice-draft-review-required'};}
      topic.questionSets[level]=generated;
    });
    topic.questions=topic.questionSets.standard.slice();topic.questionCount=tiers.reduce((n,level)=>n+topic.questionSets[level].length,0);topic.description+=` · ${topic.questionCount} original practice questions across 4 adaptive levels`;topics.push(topic);
   });
  }
  // NCERT curricular areas: activity modules rather than falsely labelled textbook chapters.
  for(const [subject,titles] of Object.entries(coCurricular)){
   subjectSet.add(subject);const book=subject==='Arts Education'?'Kriti':subject==='Physical Education and Well-being'?'Khel Yatra':'Kaushal Bodh';
   coverage.push({grade,className:`Class ${grade}`,subject,book,chapters:titles.length,source:'CBSE/NCERT curricular area; project-based/activity modules, not numbered textbook chapters',kind:'activity-modules'});
   titles.forEach((title,i)=>{const id=`ncert${grade}-${subject.toLowerCase().replace(/[^a-z]+/g,'-')}-${String(i+1).padStart(2,'0')}`;const topic={id,subject,title,description:`Class ${grade} · ${book} · activity module ${i+1}`,level:i<3?'easy':i<6?'medium':'hard',icon:icons[subject],minutes:15,prereq:[],grade,className:`Class ${grade}`,chapter:title,chapterNumber:i+1,bookTitle:book,learningOutcome:`Practise and reflect on ${title.toLowerCase()}.`,board:'CBSE curricular area',academicSession:'2026-27',sourceEdition:'CBSE/NCERT curricular area; activity module title written for LearnFlex, not a quoted NCERT chapter title',alignmentStatus:'Original activity module; educator review required',sourceUrl:'https://ncert.nic.in/',lesson:summary(subject,title),example:`Plan one safe, practical activity related to “${title}”, carry it out and reflect on the result.`,lessonI18n:{te:{title,lesson:`“${title}” అంశంపై అభ్యాసం చేసి, మీ అనుభవాన్ని వివరించండి. ఉపాధ్యాయ సమీక్ష అవసరం.`,example:'ఒక సురక్షిత కార్యాచరణను చేసి ఫలితాన్ని వివరించండి.',steps:['లక్ష్యాన్ని తెలుసుకోండి.','అవసరమైన సామగ్రిని సిద్ధం చేయండి.','సురక్షితంగా అభ్యాసం చేయండి.','ఫలితాన్ని పరిశీలించండి.'],reviewStatus:'Activity translation draft — review required'},hi:{title,lesson:`“${title}” पर अभ्यास करें और अपने अनुभव पर विचार करें। शिक्षक की समीक्षा आवश्यक है।`,example:'एक सुरक्षित गतिविधि करके परिणाम पर विचार करें।',steps:['लक्ष्य समझें।','सामग्री तैयार करें।','सुरक्षित अभ्यास करें।','परिणाम पर विचार करें।'],reviewStatus:'Activity translation draft — review required'}}};topic.questionSets={};['foundation','reinforcement','standard','challenge'].forEach(level=>topic.questionSets[level]=Array.from({length:5},(_,j)=>makeQuestion(topic,level,j)));topic.questions=topic.questionSets.standard.slice();topic.questionCount=20;topic.description+=` · ${topic.questionCount} original practice questions across 4 adaptive levels`;topics.push(topic);});
  }
  if(grade===9){const subject='Individuals in Society';subjectSet.add(subject);const titles=['Community and Social Identity','Institutions and Collective Life','Rights, Responsibilities and Participation','Understanding Social Change','Community Evidence and Reflection'];coverage.push({grade,className:`Class ${grade}`,subject,book:'CBSE Grade 9 curricular area',chapters:titles.length,source:'CBSE Grade 9 syllabus area; original learning modules, not textbook chapter titles',kind:'activity-modules'});titles.forEach((title,i)=>{const id=`ncert9-individuals-in-society-${i+1}`;const topic={id,subject,title,description:`Class 9 · Individuals in Society · learning module ${i+1}`,level:'medium',icon:'◎',minutes:15,prereq:[],grade,className:'Class 9',chapter:title,chapterNumber:i+1,bookTitle:'Individuals in Society',learningOutcome:`Use evidence and reflection to understand ${title.toLowerCase()}.`,board:'CBSE curricular area',academicSession:'2026-27',sourceEdition:'Original learning module aligned to the named NCERT curricular area; not a quoted textbook chapter',alignmentStatus:'Original module; educator review required',sourceUrl:'https://ncert.nic.in/',lesson:summary('Social Studies',title),example:`Use a local example to discuss “${title}” from more than one perspective.`,lessonI18n:{te:{title,lesson:`“${title}” అంశాన్ని ఆధారాలు మరియు ప్రతిబింబంతో అర్థం చేసుకోండి.`,example:'స్థానిక ఉదాహరణతో వివరించండి.',steps:['సందర్భాన్ని గుర్తించండి.','ఆధారాలు సేకరించండి.','వివిధ దృక్కోణాలను పోల్చండి.','మీ నిర్ణయాన్ని వివరించండి.'],reviewStatus:'Draft — review required'},hi:{title,lesson:`“${title}” को प्रमाण और चिंतन के साथ समझें।`,example:'स्थानीय उदाहरण से समझाएँ।',steps:['संदर्भ पहचानें।','प्रमाण जुटाएँ।','दृष्टिकोणों की तुलना करें।','निष्कर्ष समझाएँ।'],reviewStatus:'Draft — review required'}}};topic.questionSets={};['foundation','reinforcement','standard','challenge'].forEach(level=>topic.questionSets[level]=Array.from({length:5},(_,j)=>makeQuestion(topic,level,j)));topic.questions=topic.questionSets.standard.slice();topic.questionCount=20;topic.description+=` · ${topic.questionCount} original practice questions across 4 adaptive levels`;topics.push(topic);});}
  if(false && grade===10){const subject='Environmental Education';subjectSet.add(subject);const titles=grade10Extra[subject];coverage.push({grade,className:`Class ${grade}`,subject,book:'CBSE Grade 10 curricular area',chapters:titles.length,source:'CBSE Grade 10 curricular area; original learning modules, not textbook chapter titles',kind:'activity-modules'});titles.forEach((title,i)=>{const id=`ncert10-environmental-education-${i+1}`;const topic={id,subject,title,description:`Class 10 · Environmental Education · learning module ${i+1}`,level:'medium',icon:'♻',minutes:15,prereq:[],grade,className:'Class 10',chapter:title,chapterNumber:i+1,bookTitle:'Environmental Education',learningOutcome:`Explain environmental relationships in ${title.toLowerCase()}.`,board:'CBSE curricular area',academicSession:'2026-27',sourceEdition:'Original learning module aligned to NCERT curricular area; not a quoted textbook chapter',alignmentStatus:'Original module; educator review required',sourceUrl:'https://ncert.nic.in/',lesson:summary(subject,title),example:`Use evidence from a local environment to explain “${title}”.`,lessonI18n:{te:{title,lesson:`“${title}” అంశాన్ని పర్యావరణ ఆధారాలతో వివరించండి.`,example:'స్థానిక పర్యావరణ ఉదాహరణను ఉపయోగించండి.',steps:['సమస్యను గుర్తించండి.','ఆధారాలు సేకరించండి.','సాధ్యమైన చర్యలను పోల్చండి.','ఫలితాన్ని అంచనా వేయండి.'],reviewStatus:'Draft — review required'},hi:{title,lesson:`“${title}” को पर्यावरणीय प्रमाणों से समझाएँ।`,example:'स्थानीय पर्यावरण का उदाहरण लें।',steps:['समस्या पहचानें।','प्रमाण जुटाएँ।','कार्रवाइयों की तुलना करें।','परिणाम का अनुमान लगाएँ।'],reviewStatus:'Draft — review required'}}};topic.questionSets={};['foundation','reinforcement','standard','challenge'].forEach(level=>topic.questionSets[level]=Array.from({length:5},(_,j)=>makeQuestion(topic,level,j)));topic.questions=topic.questionSets.standard.slice();topic.questionCount=20;topic.description+=` · ${topic.questionCount} original practice questions across 4 adaptive levels`;topics.push(topic);});}
 }
 // Only add prerequisite edges that are explicit and defensible from the listed concept sequence.
 const prerequisiteRules=[
  [7,'Mathematics','Working with Fractions',[[6,'Mathematics','Fractions']]],
  [8,'Mathematics','Proportional Reasoning–1',[[7,'Mathematics','Working with Fractions']]],
  [8,'Mathematics','Fractions in Disguise',[[7,'Mathematics','Working with Fractions']]],
  [8,'Mathematics','Algebra Play',[[7,'Mathematics','Expressions Using Letter-Numbers']]],
  [9,'Mathematics','Introduction to Linear Polynomials',[[8,'Mathematics','Algebra Play']]],
  [9,'Mathematics','Exploring Algebraic Identities',[[9,'Mathematics','Introduction to Linear Polynomials']]],
  [9,'Mathematics','Linear Equations in Two Variables',[[8,'Mathematics','Algebra Play']]],
  [10,'Mathematics','Polynomials',[[9,'Mathematics','Introduction to Linear Polynomials'],[9,'Mathematics','Exploring Algebraic Identities']]],
  [10,'Mathematics','Pair of Linear Equations in Two Variables',[[9,'Mathematics','Linear Equations in Two Variables']]],
  [10,'Mathematics','Quadratic Equations',[[10,'Mathematics','Polynomials']]],
  [8,'Science','The Invisible Living World: Beyond Our Naked Eye',[[7,'Science','The Ever-Evolving World of Science']]],
  [9,'Science','Cell: The Building Block of Life',[[8,'Science','The Invisible Living World: Beyond Our Naked Eye']]],
  [9,'Science','Tissues in Action',[[9,'Science','Cell: The Building Block of Life']]],
  [10,'Science','Life Processes',[[9,'Science','Tissues in Action']]],
  [10,'Science','How Do Organisms Reproduce?',[[9,'Science','Cell: The Building Block of Life'],[10,'Science','Life Processes']]],
  [10,'Science','Acids, Bases and Salts',[[10,'Science','Chemical Reactions and Equations']]],
  [10,'Science','Metals and Non-metals',[[10,'Science','Chemical Reactions and Equations']]],
 ];
 const topicLookup=new Map(topics.map(t=>[`${t.grade}|${t.subject}|${t.title}`,t]));
 let prerequisiteEdges=0;
 for(const [grade,subject,title,requirements] of prerequisiteRules){
  const topic=topicLookup.get(`${grade}|${subject}|${title}`);if(!topic)continue;
  const ids=requirements.map(([g,s,t])=>topicLookup.get(`${g}|${s}|${t}`)).filter(Boolean).map(t=>t.id);
  topic.prereq=[...new Set(ids.filter(id=>id!==topic.id))];prerequisiteEdges+=topic.prereq.length;
 }
 const topicIds=new Set(topics.map(t=>t.id));
 for(const topic of topics) topic.prereq=(topic.prereq||[]).filter(id=>topicIds.has(id)&&id!==topic.id);
 pack.prerequisiteCoverage={topicsWithExplicitPrerequisites:topics.filter(t=>t.prereq.length).length,explicitEdges:prerequisiteEdges,coverageNote:'A limited set of explicit mathematics and science prerequisite links is included. Modules without a verified link remain unlinked; this is not a complete concept graph.'};
 pack.topics=topics;pack.board='CBSE (NCERT-aligned)';pack.academicSession='2026-27';pack.sourceEdition='CBSE 2026–27 curriculum; NCERT textbook editions by class and continuing-cohort provisions for Class 10';pack.subjects=[...subjectSet].sort();pack.subjectClassCoverage=coverage;pack.sources={cbseCurriculum2027:'https://cbseacademic.nic.in/curriculum_2027.html',ncertTextbooks:'https://ncert.nic.in/textbook.php',cbseSkillEducation:'https://cbseacademic.nic.in/skill-education.html'};pack.sourceNote='This project is aligned to the CBSE 2026–27 curriculum and uses NCERT textbook chapter catalogues for Classes 6–10 where applicable. Class 10 follows the continuing-cohort textbook/course provisions. Subject/language options vary by class and school; optional language choices shown are catalogue choices, not a claim that every student studies every language. Arts, PE, Vocational, Individuals in Society and Environmental Education entries are curricular learning/activity modules, not falsely labelled textbook chapters. Questions are original chapter-aligned practice drafts, not copied NCERT questions; language content and all answer keys require educator review.';pack.alignmentStatus='Full chapter-map expansion for the listed current textbook editions; original practice content requires subject-teacher review.';pack.reviewWorkflow={status:'educator-validation-required',message:'Check each CBSE school’s prescribed subject/language combination and textbook edition. The catalog includes the listed chapters/modules for the books represented; school subject options vary by class and scheme. Generated MCQs are original practice drafts and are not official NCERT assessment items.'};
 console.info(`[LearnFlex] CBSE/NCERT catalog loaded: ${topics.length} chapter/activity modules across Classes 6–10; ${topics.reduce((n,t)=>n+(t.questionCount||0),0)} practice questions.`);
})(typeof window!=='undefined'?window:globalThis);
