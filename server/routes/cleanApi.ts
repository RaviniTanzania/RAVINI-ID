import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { getCleanDb } from '../db/cleanDb';
import {
  cleanAuthMiddleware,
  requireCleanRole,
  requireCleanPermission,
  CleanAuthRequest
} from '../middleware/cleanAuth';
import {
  CleanUser,
  BusinessApplication,
  SokoniProduct,
  WingaAd,
  MovieItem,
  FundiListing,
  CreditTransaction,
  UserRole,
  SystemConfig
} from '../types/raviniTypes';

const router = Router();
const db = getCleanDb();

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

function sanitizeUser(user: CleanUser) {
  const { password, ...safeUser } = user;
  return safeUser;
}

// -------------------------------------------------------------
// 1. PUBLIC & AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

router.get('/public/config', async (_req, res) => {
  try {
    await db.initialize();
    const config = await db.getConfig();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata mipangilio.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    await db.initialize();
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali weka nambari ya simu na nenosiri.'
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const user = await db.getUserByPhone(cleanPhone);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nambari ya simu au nenosiri si sahihi.'
      });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Nambari ya simu au nenosiri si sahihi.'
      });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Akaunti yako imezuiwa (Blocked) na Msimamizi Mkuu.'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Akaunti yako imesimamishwa kwa muda.'
      });
    }

    const token = `${user.id}:${Date.now()}`;

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      target: `User:${user.id}`,
      targetId: user.id,
      details: `User ${user.name} logged in with role ${user.role}`
    });

    res.json({
      success: true,
      message: `Karibu tena, ${user.firstName}!`,
      token,
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya mfumo wakati wa kuingia.' });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    await db.initialize();
    const { firstName, lastName, phone, password, businessName } = req.body;

    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali jaza Jina la Kwanza, Jina la Pili, Nambari ya Simu na Nenosiri.'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Nenosiri lazima liwe na angalau herufi 4.'
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali weka nambari sahihi ya simu (mfano: 0748604483 au 255748604483).'
      });
    }

    const existingUser = await db.getUserByPhone(cleanPhone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Nambari hii ya simu tayari imesajiliwa kwenye RAVINI.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: CleanUser = {
      id: newUserId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      phone: cleanPhone,
      password: hashedPassword,
      role: 'CUSTOMER', // Strictly CUSTOMER - Admin/Super Admin can never be registered
      businessName: businessName?.trim() || undefined,
      businessApproved: false,
      permissions: [],
      status: 'ACTIVE',
      walletBalance: 0, // Strict zero initial balance
      createdAt: new Date().toISOString()
    };

    await db.saveUser(newUser);

    await db.addAuditLog({
      actorId: newUser.id,
      actorName: newUser.name,
      actorRole: 'CUSTOMER',
      action: 'CUSTOMER_REGISTRATION',
      target: `User:${newUser.id}`,
      targetId: newUser.id,
      details: `Customer ${newUser.name} registered with phone ${newUser.phone}`
    });

    const token = `${newUser.id}:${Date.now()}`;

    res.status(201).json({
      success: true,
      message: `Hongera ${newUser.firstName}, akaunti yako ya RAVINI imefunguliwa kikamilifu!`,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya mfumo wakati wa usajili.' });
  }
});

router.get('/auth/me', cleanAuthMiddleware, async (req: CleanAuthRequest, res: Response) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user!)
  });
});

// -------------------------------------------------------------
// 2. CUSTOMER WORKSPACE ENDPOINTS (/api/customer/*)
// -------------------------------------------------------------

router.get('/customer/home', cleanAuthMiddleware, requireCleanRole('CUSTOMER', 'ADMIN', 'SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const products = await db.getProducts({ status: 'APPROVED' });
    const ads = await db.getAds({ status: 'APPROVED' });
    const movies = await db.getMovies({ status: 'APPROVED' });
    const fundis = await db.getFundis({ status: 'APPROVED' });

    res.json({
      success: true,
      featuredProducts: products.slice(0, 10),
      featuredAds: ads.slice(0, 10),
      featuredMovies: movies.slice(0, 10),
      featuredFundis: fundis.slice(0, 10)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupakia kurasa ya mteja.' });
  }
});

router.get('/customer/search', cleanAuthMiddleware, requireCleanRole('CUSTOMER', 'ADMIN', 'SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const query = ((req.query.q as string) || '').trim().toLowerCase();
    const category = ((req.query.category as string) || 'yote').toLowerCase();

    const [products, ads, movies, fundis] = await Promise.all([
      db.getProducts({ status: 'APPROVED' }),
      db.getAds({ status: 'APPROVED' }),
      db.getMovies({ status: 'APPROVED' }),
      db.getFundis({ status: 'APPROVED' })
    ]);

    const filterText = (str: string) => !query || str.toLowerCase().includes(query);

    const results = {
      sokoni: (category === 'yote' || category === 'sokoni')
        ? products.filter(p => filterText(p.title) || filterText(p.description) || filterText(p.category))
        : [],
      winga: (category === 'yote' || category === 'winga')
        ? ads.filter(a => filterText(a.title) || filterText(a.description) || filterText(a.location) || filterText(a.adType))
        : [],
      movies: (category === 'yote' || category === 'movies')
        ? movies.filter(m => filterText(m.title) || filterText(m.genre) || filterText(m.description))
        : [],
      mafundi: (category === 'yote' || category === 'mafundi')
        ? fundis.filter(f => filterText(f.fundiName) || filterText(f.serviceType) || filterText(f.location) || f.skills.some(s => filterText(s)))
        : []
    };

    const totalCount = results.sokoni.length + results.winga.length + results.movies.length + results.mafundi.length;

    res.json({
      success: true,
      query,
      category,
      totalCount,
      results
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufanya utafutaji.' });
  }
});

router.get('/customer/dashboard', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [applications, notifications, myProducts, myAds, myMovies] = await Promise.all([
      db.getUserApplications(userId),
      db.getNotifications(userId),
      db.getProducts({ vendorId: userId }),
      db.getAds({ wingaId: userId }),
      db.getMovies({ sellerId: userId })
    ]);

    res.json({
      success: true,
      user: sanitizeUser(req.user!),
      applications,
      notifications: notifications.slice(0, 15),
      unreadNotificationsCount: notifications.filter(n => !n.read).length,
      myListings: {
        products: myProducts,
        ads: myAds,
        movies: myMovies
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupakia dashibodi ya mteja.' });
  }
});

router.post('/customer/business-application', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const { category, businessName, description, servicesOrProducts, contactPhone, location } = req.body;

    if (!category || !businessName || !description) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali jaza taarifa zote za maombi ya biashara.'
      });
    }

    const validCategories = ['fundi', 'sokoni', 'movies', 'winga'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Kategoria ya biashara si sahihi (chagua Fundi, Sokoni, Movies, au Winga).'
      });
    }

    const user = req.user!;
    const newApp: BusinessApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      category,
      businessName: businessName.trim(),
      description: description.trim(),
      servicesOrProducts: (servicesOrProducts || '').trim(),
      contactPhone: (contactPhone || user.phone).trim(),
      location: location?.trim(),
      status: 'PENDING',
      submittedAt: new Date().toISOString()
    };

    await db.saveApplication(newApp);

    await db.addNotification({
      userId: user.id,
      title: 'Maombi ya Biashara Yametumwa',
      message: `Maombi yako ya kuwa ${category.toUpperCase()} (${businessName}) yamepokelewa na yanakaguliwa na Wasimamizi.`,
      type: 'application'
    });

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: 'CUSTOMER',
      action: 'BUSINESS_APPLICATION_SUBMITTED',
      target: `Application:${newApp.id}`,
      targetId: newApp.id,
      details: `Customer ${user.name} applied for ${category} business (${businessName})`
    });

    res.status(201).json({
      success: true,
      message: 'Maombi yako yametumwa kikamilifu! Utapokea taarifa punde yatakapoidhinishwa.',
      application: newApp
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kutuma maombi.' });
  }
});

router.get('/customer/my-applications', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const apps = await db.getUserApplications(req.user!.id);
    res.json({ success: true, applications: apps });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata maombi yako.' });
  }
});

// Customer Publishing Endpoints (Requires Approved Business)
router.post('/customer/publish/product', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (!user.businessApproved || user.businessCategory !== 'sokoni') {
      return res.status(403).json({
        success: false,
        message: 'Huna idhini ya kuuza bidhaa Sokoni. Omba kuwa muuzaji wa Sokoni kwanza.'
      });
    }

    const config = await db.getConfig();
    const requiredCredits = config.postPriceCredits || 1;

    if (user.walletBalance < requiredCredits) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Salio la credits halitoshi. Unahitaji Credits ${requiredCredits} kuchapisha bidhaa. Ongeza salio kupitia WhatsApp ya Manager.`
      });
    }

    const { title, description, priceTzs, category, images } = req.body;
    if (!title || !priceTzs) {
      return res.status(400).json({ success: false, message: 'Weka jina la bidhaa na bei.' });
    }

    // Atomic credit deduction
    const deductResult = await db.deductCredits(user.id, requiredCredits, {
      actorId: user.id,
      actorName: user.name,
      actorRole: 'CUSTOMER',
      reference: `SOKONI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reason: `Malipo ya kuchapisha bidhaa Sokoni: ${title}`,
      relatedAction: 'publish_product'
    });

    if (!deductResult.success) {
      return res.status(deductResult.code === 'INSUFFICIENT_CREDITS' ? 402 : 400).json({
        success: false,
        code: deductResult.code,
        message: deductResult.error
      });
    }

    const newProduct: SokoniProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      vendorId: user.id,
      vendorName: user.name,
      vendorPhone: user.phone,
      title: title.trim(),
      description: (description || '').trim(),
      priceTzs: Number(priceTzs),
      category: (category || 'Jumla').trim(),
      images: Array.isArray(images) ? images : [],
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    await db.saveProduct(newProduct);

    res.status(201).json({
      success: true,
      message: `Bidhaa imetumwa kwa uhakiki na credits ${requiredCredits} imekatwa!`,
      product: newProduct,
      remainingCredits: deductResult.newBalance
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuchapisha bidhaa.' });
  }
});

router.post('/customer/publish/ad', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (!user.businessApproved || user.businessCategory !== 'winga') {
      return res.status(403).json({
        success: false,
        message: 'Huna idhini ya kutangaza kama Winga. Omba kuwa Winga kwanza.'
      });
    }

    const config = await db.getConfig();
    const requiredCredits = config.postPriceCredits || 1;

    const { title, adType, description, priceTzs, location, images } = req.body;
    if (!title || !adType) {
      return res.status(400).json({ success: false, message: 'Weka kichwa cha tangazo na aina.' });
    }

    // Atomic credit deduction
    const deductResult = await db.deductCredits(user.id, requiredCredits, {
      actorId: user.id,
      actorName: user.name,
      actorRole: 'CUSTOMER',
      reference: `WINGA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reason: `Malipo ya kutangaza kama Winga: ${title}`,
      relatedAction: 'publish_winga_ad'
    });

    if (!deductResult.success) {
      return res.status(deductResult.code === 'INSUFFICIENT_CREDITS' ? 402 : 400).json({
        success: false,
        code: deductResult.code,
        message: deductResult.error
      });
    }

    const newAd: WingaAd = {
      id: `ad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wingaId: user.id,
      wingaName: user.name,
      wingaPhone: user.phone,
      title: title.trim(),
      adType: adType || 'product',
      description: (description || '').trim(),
      priceTzs: Number(priceTzs) || 0,
      location: (location || 'Tanzania').trim(),
      images: Array.isArray(images) ? images : [],
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    await db.saveAd(newAd);

    res.status(201).json({
      success: true,
      message: `Tangazo limetumwa kwa uhakiki na credit ${requiredCredits} imekatwa!`,
      ad: newAd,
      remainingCredits: deductResult.newBalance
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kutangaza.' });
  }
});

router.post('/customer/publish/movie', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (!user.businessApproved || user.businessCategory !== 'movies') {
      return res.status(403).json({
        success: false,
        message: 'Huna idhini ya kuuza filamu. Omba kuwa Muuzaji wa Movies kwanza.'
      });
    }

    const config = await db.getConfig();
    const requiredCredits = config.videoPriceCredits || 2;

    if (user.walletBalance < requiredCredits) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Salio halitoshi. Unahitaji Credits ${requiredCredits} kupakia filamu.`
      });
    }

    const { title, genre, durationMinutes, description, posterUrl, videoUrl } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, message: 'Weka jina la filamu na kiunganishi cha video.' });
    }

    // Atomic credit deduction
    const deductResult = await db.deductCredits(user.id, requiredCredits, {
      actorId: user.id,
      actorName: user.name,
      actorRole: 'CUSTOMER',
      reference: `MOV-UPLOAD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reason: `Malipo ya kupakia filamu mpya: ${title}`,
      relatedAction: 'publish_movie'
    });

    if (!deductResult.success) {
      return res.status(deductResult.code === 'INSUFFICIENT_CREDITS' ? 402 : 400).json({
        success: false,
        code: deductResult.code,
        message: deductResult.error
      });
    }

    const newMovie: MovieItem = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sellerId: user.id,
      sellerName: user.name,
      title: title.trim(),
      genre: (genre || 'Drama').trim(),
      durationMinutes: Number(durationMinutes) || 90,
      description: (description || '').trim(),
      posterUrl: posterUrl?.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      videoUrl: videoUrl.trim(),
      status: 'PENDING',
      viewsCount: 0,
      createdAt: new Date().toISOString()
    };

    await db.saveMovie(newMovie);

    res.status(201).json({
      success: true,
      message: `Filamu imetumwa kwa uhakiki na credits ${requiredCredits} zimekatwa!`,
      movie: newMovie,
      remainingCredits: deductResult.newBalance
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupakia filamu.' });
  }
});

router.post('/customer/movies/:id/authorize', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const movieId = getParam(req.params.id);
    const movie = await db.getMovieById(movieId);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Filamu haikupatikana.' });
    }

    if (movie.status !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Filamu hii bado haijakamilisha uhakiki.' });
    }

    const user = req.user!;
    const config = await db.getConfig();
    const requiredCredits = config.moviePriceCredits || 3;

    // Atomic credit deduction
    const deductResult = await db.deductCredits(user.id, requiredCredits, {
      actorId: user.id,
      actorName: user.name,
      actorRole: 'CUSTOMER',
      reference: `STREAM-${movieId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reason: `Kutazama filamu: ${movie.title}`,
      relatedAction: 'movie_stream',
      relatedId: movie.id
    });

    if (!deductResult.success) {
      return res.status(deductResult.code === 'INSUFFICIENT_CREDITS' ? 402 : 400).json({
        success: false,
        authorized: false,
        code: deductResult.code,
        message: deductResult.error
      });
    }

    movie.viewsCount = (movie.viewsCount || 0) + 1;
    await db.saveMovie(movie);

    res.json({
      success: true,
      authorized: true,
      message: `Umefanikiwa kupata idhini ya kutazama "${movie.title}". Credits ${requiredCredits} zimekatwa.`,
      remainingCredits: deductResult.newBalance,
      playback: {
        id: movie.id,
        title: movie.title,
        videoUrl: movie.videoUrl,
        posterUrl: movie.posterUrl
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuidhinisha filamu.' });
  }
});

router.get('/customer/notifications', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const notifs = await db.getNotifications(req.user!.id);
    res.json({ success: true, notifications: notifs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata taarifa.' });
  }
});

router.put('/customer/notifications/:id/read', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    await db.markNotificationRead(getParam(req.params.id), req.user!.id);
    res.json({ success: true, message: 'Taarifa imesomwa.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya taarifa.' });
  }
});

// -------------------------------------------------------------
// 3. ADMIN WORKSPACE ENDPOINTS (/api/admin/*)
// (Allowed for ADMIN and SUPER_ADMIN. Super Admin retains role!)
// -------------------------------------------------------------

router.get('/admin/overview', cleanAuthMiddleware, requireCleanRole('ADMIN', 'SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const [apps, products, ads, movies] = await Promise.all([
      db.getApplications(),
      db.getProducts(),
      db.getAds(),
      db.getMovies()
    ]);

    res.json({
      success: true,
      pendingApplications: apps.filter(a => a.status === 'PENDING').length,
      pendingProducts: products.filter(p => p.status === 'PENDING').length,
      pendingAds: ads.filter(a => a.status === 'PENDING').length,
      pendingMovies: movies.filter(m => m.status === 'PENDING').length,
      totalApprovedApplications: apps.filter(a => a.status === 'APPROVED').length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata muhtasari wa wasimamizi.' });
  }
});

router.get('/admin/applications', cleanAuthMiddleware, requireCleanRole('ADMIN', 'SUPER_ADMIN'), requireCleanPermission('REVIEW_APPLICATIONS'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const status = (req.query.status as string) || undefined;
    const applications = await db.getApplications(status);
    res.json({ success: true, applications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata maombi.' });
  }
});

router.post('/admin/applications/:id/approve', cleanAuthMiddleware, requireCleanRole('ADMIN', 'SUPER_ADMIN'), requireCleanPermission('REVIEW_APPLICATIONS'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const appId = getParam(req.params.id);
    const application = await db.getApplicationById(appId);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Maombi hayajapatikana.' });
    }

    const reviewer = req.user!;
    application.status = 'APPROVED';
    application.reviewedAt = new Date().toISOString();
    application.reviewedBy = reviewer.name;
    application.reviewedByRole = reviewer.role; // Note: logged as SUPER_ADMIN if reviewer is SUPER_ADMIN!
    await db.saveApplication(application);

    // Update target user's business status
    const targetUser = await db.getUserById(application.userId);
    if (targetUser) {
      targetUser.businessApproved = true;
      targetUser.businessCategory = application.category;
      targetUser.businessName = application.businessName;
      await db.saveUser(targetUser);

      // If category is Fundi, auto-create Fundi profile
      if (application.category === 'fundi') {
        await db.saveFundi({
          id: `fundi_${targetUser.id}`,
          fundiId: targetUser.id,
          fundiName: targetUser.name,
          phone: application.contactPhone || targetUser.phone,
          serviceType: application.businessName,
          skills: [application.category, 'Ufundi Stadi'],
          bio: application.description,
          location: application.location || 'Tanzania',
          status: 'APPROVED',
          createdAt: new Date().toISOString()
        });
      }

      await db.addNotification({
        userId: targetUser.id,
        title: 'Hongera! Maombi Yako Yameidhinishwa',
        message: `Maombi yako ya kuwa ${application.category.toUpperCase()} (${application.businessName}) yameidhinishwa na Msimamizi (${reviewer.name}). Sasa unaweza kuanza kutumia huduma za kibiashara!`,
        type: 'application'
      });
    }

    await db.addAuditLog({
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorRole: reviewer.role,
      action: 'APPROVE_BUSINESS_APPLICATION',
      target: `Application:${application.id}`,
      targetId: application.id,
      details: `${reviewer.role} ${reviewer.name} approved application for ${application.userName} (${application.category})`
    });

    res.json({
      success: true,
      message: `Maombi ya ${application.userName} yameidhinishwa kikamilifu!`,
      application
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuidhinisha maombi.' });
  }
});

router.post('/admin/applications/:id/reject', cleanAuthMiddleware, requireCleanRole('ADMIN', 'SUPER_ADMIN'), requireCleanPermission('REVIEW_APPLICATIONS'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const appId = getParam(req.params.id);
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali weka sababu ya kukataa maombi haya.'
      });
    }

    const application = await db.getApplicationById(appId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Maombi hayajapatikana.' });
    }

    const reviewer = req.user!;
    application.status = 'REJECTED';
    application.rejectionReason = reason.trim();
    application.reviewedAt = new Date().toISOString();
    application.reviewedBy = reviewer.name;
    application.reviewedByRole = reviewer.role;
    await db.saveApplication(application);

    await db.addNotification({
      userId: application.userId,
      title: 'Taarifa Kuhusu Maombi Yako',
      message: `Maombi yako ya kuwa ${application.category.toUpperCase()} yamekataliwa. Sababu: ${reason.trim()}`,
      type: 'application'
    });

    await db.addAuditLog({
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorRole: reviewer.role,
      action: 'REJECT_BUSINESS_APPLICATION',
      target: `Application:${application.id}`,
      targetId: application.id,
      details: `${reviewer.role} ${reviewer.name} rejected application for ${application.userName}. Reason: ${reason}`
    });

    res.json({
      success: true,
      message: 'Maombi yamekataliwa na mhusika amearifiwa.',
      application
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kukataa maombi.' });
  }
});

router.get('/admin/content-review', cleanAuthMiddleware, requireCleanRole('ADMIN', 'SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const [products, ads, movies] = await Promise.all([
      db.getProducts(),
      db.getAds(),
      db.getMovies()
    ]);

    res.json({
      success: true,
      pendingProducts: products.filter(p => p.status === 'PENDING'),
      pendingAds: ads.filter(a => a.status === 'PENDING'),
      pendingMovies: movies.filter(m => m.status === 'PENDING')
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata maudhui ya uhakiki.' });
  }
});

router.post('/admin/content-review/:type/:id/:action', cleanAuthMiddleware, requireCleanRole('ADMIN', 'SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const type = getParam(req.params.type);
    const id = getParam(req.params.id);
    const action = getParam(req.params.action);
    const { reason } = req.body || {};
    const reviewer = req.user!;

    // Granular permission check for ADMIN role
    if (reviewer.role === 'ADMIN') {
      const perms = reviewer.permissions || [];
      if (type === 'product' && !perms.includes('MODERATE_CONTENT')) {
        return res.status(403).json({ success: false, message: "Huna idhini ya 'MODERATE_CONTENT'." });
      }
      if (type === 'ad' && !perms.includes('REVIEW_ADS') && !perms.includes('MODERATE_CONTENT')) {
        return res.status(403).json({ success: false, message: "Huna idhini ya 'REVIEW_ADS'." });
      }
      if (type === 'movie' && !perms.includes('REVIEW_MOVIES') && !perms.includes('MODERATE_CONTENT')) {
        return res.status(403).json({ success: false, message: "Huna idhini ya 'REVIEW_MOVIES'." });
      }
    }

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ success: false, message: 'Kitendo si sahihi (approve au reject pekee).' });
    }

    if (action === 'reject' && (!reason || !reason.trim())) {
      return res.status(400).json({ success: false, message: 'Tafadhali weka sababu ya kukataa maudhui haya.' });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    if (type === 'product') {
      const product = await db.getProductById(id);
      if (!product) return res.status(404).json({ success: false, message: 'Bidhaa haikupatikana.' });

      product.status = newStatus;
      product.rejectionReason = action === 'reject' ? reason : undefined;
      product.reviewedAt = new Date().toISOString();
      product.reviewedBy = reviewer.name;
      await db.saveProduct(product);

      await db.addNotification({
        userId: product.vendorId,
        title: action === 'approve' ? 'Bidhaa Yako Imeidhinishwa!' : 'Bidhaa Yako Imekataliwa',
        message: action === 'approve'
          ? `Bidhaa yako "${product.title}" imeidhinishwa na sasa inaonekana Sokoni.`
          : `Bidhaa yako "${product.title}" imekataliwa. Sababu: ${reason}`,
        type: 'content'
      });
    } else if (type === 'ad') {
      const ad = await db.getAdById(id);
      if (!ad) return res.status(404).json({ success: false, message: 'Tangazo halikupatikana.' });

      ad.status = newStatus;
      ad.rejectionReason = action === 'reject' ? reason : undefined;
      ad.reviewedAt = new Date().toISOString();
      ad.reviewedBy = reviewer.name;
      await db.saveAd(ad);

      await db.addNotification({
        userId: ad.wingaId,
        title: action === 'approve' ? 'Tangazo Lako Limeidhinishwa!' : 'Tangazo Lako Limekataliwa',
        message: action === 'approve'
          ? `Tangazo lako la Winga "${ad.title}" limeidhinishwa na sasa lipo hadharani.`
          : `Tangazo lako la Winga "${ad.title}" limekataliwa. Sababu: ${reason}`,
        type: 'content'
      });
    } else if (type === 'movie') {
      const movie = await db.getMovieById(id);
      if (!movie) return res.status(404).json({ success: false, message: 'Filamu haikupatikana.' });

      movie.status = newStatus;
      movie.rejectionReason = action === 'reject' ? reason : undefined;
      movie.reviewedAt = new Date().toISOString();
      movie.reviewedBy = reviewer.name;
      await db.saveMovie(movie);

      await db.addNotification({
        userId: movie.sellerId,
        title: action === 'approve' ? 'Filamu Yako Imeidhinishwa!' : 'Filamu Yako Imekataliwa',
        message: action === 'approve'
          ? `Filamu yako "${movie.title}" imeidhinishwa na sasa inapatikana kwenye orodha ya Movies.`
          : `Filamu yako "${movie.title}" imekataliwa. Sababu: ${reason}`,
        type: 'content'
      });
    } else {
      return res.status(400).json({ success: false, message: 'Aina ya maudhui si sahihi (product, ad, au movie).' });
    }

    await db.addAuditLog({
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorRole: reviewer.role,
      action: `${action.toUpperCase()}_CONTENT`,
      target: `${type}:${id}`,
      targetId: id,
      details: `${reviewer.role} ${reviewer.name} ${action}d ${type} ${id}`
    });

    res.json({
      success: true,
      message: `Maudhui yamechakatwa (${action === 'approve' ? 'Yameidhinishwa' : 'Yamekataliwa'}).`
    });
  } catch (err: any) {
    console.error('[CleanApi moderateContent Error]', err);
    res.status(500).json({ success: false, message: err?.message || 'Hitilafu ya kuhakiki maudhui.' });
  }
});

router.get('/admin/reports', cleanAuthMiddleware, requireCleanRole('ADMIN', 'SUPER_ADMIN'), requireCleanPermission('VIEW_REPORTS'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const [apps, products, ads, movies, transactions] = await Promise.all([
      db.getApplications(),
      db.getProducts(),
      db.getAds(),
      db.getMovies(),
      db.getTransactions()
    ]);

    res.json({
      success: true,
      summary: {
        totalApplications: apps.length,
        approvedApplications: apps.filter(a => a.status === 'APPROVED').length,
        rejectedApplications: apps.filter(a => a.status === 'REJECTED').length,
        pendingApplications: apps.filter(a => a.status === 'PENDING').length,
        totalProducts: products.length,
        approvedProducts: products.filter(p => p.status === 'APPROVED').length,
        totalAds: ads.length,
        approvedAds: ads.filter(a => a.status === 'APPROVED').length,
        totalMovies: movies.length,
        approvedMovies: movies.filter(m => m.status === 'APPROVED').length,
        totalTransactions: transactions.length,
        totalCreditsDeducted: transactions.filter(t => t.type === 'DEDUCTION').reduce((acc, t) => acc + t.amount, 0)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupakia ripoti za kiutawala.' });
  }
});

// -------------------------------------------------------------
// 4. SUPER ADMIN MANAGEMENT ENDPOINTS (/api/super-admin/*)
// (STRICTLY SUPER_ADMIN ONLY! CUSTOMER and ADMIN get 403!)
// -------------------------------------------------------------

router.get('/super-admin/overview', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const [users, apps, products, ads, movies, transactions, auditLogs] = await Promise.all([
      db.getUsers(),
      db.getApplications(),
      db.getProducts(),
      db.getAds(),
      db.getMovies(),
      db.getTransactions(),
      db.getAuditLogs(10)
    ]);

    const customers = users.filter(u => u.role === 'CUSTOMER');
    const admins = users.filter(u => u.role === 'ADMIN');
    const totalCreditsInCirculation = customers.reduce((acc, u) => acc + (u.walletBalance || 0), 0);

    res.json({
      success: true,
      overview: {
        totalUsers: users.length,
        totalCustomers: customers.length,
        totalAdmins: admins.length,
        totalApplications: apps.length,
        pendingApplications: apps.filter(a => a.status === 'PENDING').length,
        totalProducts: products.length,
        totalAds: ads.length,
        totalMovies: movies.length,
        totalCreditsInCirculation,
        totalTransactions: transactions.length,
        recentAuditLogs: auditLogs
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata muhtasari wa usimamizi mkuu.' });
  }
});

// User Management
router.get('/super-admin/users', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const search = ((req.query.q as string) || '').trim().toLowerCase();
    const role = (req.query.role as string) || undefined;

    let users = await db.getUsers();

    if (role) {
      users = users.filter(u => u.role === role);
    }

    if (search) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(search) ||
        u.phone.includes(search) ||
        (u.businessName && u.businessName.toLowerCase().includes(search))
      );
    }

    res.json({
      success: true,
      users: users.map(sanitizeUser)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata orodha ya watumiaji.' });
  }
});

router.put('/super-admin/users/:id/status', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const userId = getParam(req.params.id);

    if (!['ACTIVE', 'BLOCKED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Hali si sahihi.' });
    }

    const targetUser = await db.getUserById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Huwezi kuzuia au kusimamisha Super Admin.' });
    }

    targetUser.status = status;
    await db.saveUser(targetUser);

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_USER_STATUS',
      target: `User:${targetUser.id}`,
      targetId: targetUser.id,
      details: `Super Admin ${req.user!.name} changed user ${targetUser.name} status to ${status}`
    });

    res.json({
      success: true,
      message: `Hali ya ${targetUser.name} imebadilishwa kuwa ${status}.`,
      user: sanitizeUser(targetUser)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kubadili hali ya mtumiaji.' });
  }
});

router.post('/super-admin/users/:id/reset-password', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    const { newPassword } = req.body;
    const passwordToSet = newPassword?.trim() || '1234';

    const targetUser = await db.getUserById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    const salt = bcrypt.genSaltSync(10);
    targetUser.password = bcrypt.hashSync(passwordToSet, salt);
    await db.saveUser(targetUser);

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'RESET_USER_PASSWORD',
      target: `User:${targetUser.id}`,
      targetId: targetUser.id,
      details: `Super Admin ${req.user!.name} reset password for user ${targetUser.name}`
    });

    res.json({
      success: true,
      message: `Nenosiri la ${targetUser.name} limewekwa upya kuwa "${passwordToSet}".`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuweka upya nenosiri.' });
  }
});

router.delete('/super-admin/users/:id', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const userId = getParam(req.params.id);
    const targetUser = await db.getUserById(userId);

    if (!targetUser) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Huwezi kumfuta Super Admin.' });
    }

    const deleted = await db.deleteUser(userId);
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'Haikuwezekana kumfuta mtumiaji huyu.' });
    }

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'DELETE_USER',
      target: `User:${userId}`,
      targetId: userId,
      details: `Super Admin ${req.user!.name} deleted user ${targetUser.name} (${targetUser.phone})`
    });

    res.json({
      success: true,
      message: `Mtumiaji ${targetUser.name} amefutwa kikamilifu.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufuta mtumiaji.' });
  }
});

// Admin Management
router.get('/super-admin/admins', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const admins = users.filter(u => u.role === 'ADMIN');
    res.json({ success: true, admins: admins.map(sanitizeUser) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata orodha ya wasimamizi.' });
  }
});

router.post('/super-admin/admins', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, password, permissions } = req.body;

    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali jaza jina la kwanza, jina la pili, simu na nenosiri la Admin mpya.'
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const existing = await db.getUserByPhone(cleanPhone);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Nambari hii ya simu tayari inatumika na mtumiaji mwingine.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const validPermissions = [
      'REVIEW_APPLICATIONS',
      'REVIEW_ADS',
      'REVIEW_MOVIES',
      'MODERATE_CONTENT',
      'VIEW_REPORTS'
    ];

    const assignedPermissions = Array.isArray(permissions)
      ? permissions.filter(p => validPermissions.includes(p))
      : validPermissions;

    const newAdmin: CleanUser = {
      id: `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      phone: cleanPhone,
      password: hashedPassword,
      role: 'ADMIN',
      businessApproved: true,
      permissions: assignedPermissions,
      status: 'ACTIVE',
      walletBalance: 0,
      createdAt: new Date().toISOString()
    };

    await db.saveUser(newAdmin);

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'CREATE_ADMIN',
      target: `Admin:${newAdmin.id}`,
      targetId: newAdmin.id,
      details: `Super Admin ${req.user!.name} created Admin ${newAdmin.name} with permissions: ${assignedPermissions.join(', ')}`
    });

    res.status(201).json({
      success: true,
      message: `Msimamizi ${newAdmin.name} ametengenezwa kikamilifu!`,
      admin: sanitizeUser(newAdmin)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kutengeneza admin.' });
  }
});

router.put('/super-admin/admins/:id/permissions', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const adminId = getParam(req.params.id);
    const { permissions } = req.body;

    const targetAdmin = await db.getUserById(adminId);
    if (!targetAdmin || targetAdmin.role !== 'ADMIN') {
      return res.status(404).json({ success: false, message: 'Msimamizi hakupatikana.' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permissions lazima ziwe safu (array).' });
    }

    targetAdmin.permissions = permissions;
    await db.saveUser(targetAdmin);

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_ADMIN_PERMISSIONS',
      target: `Admin:${targetAdmin.id}`,
      targetId: targetAdmin.id,
      details: `Super Admin ${req.user!.name} updated permissions for ${targetAdmin.name}: ${permissions.join(', ')}`
    });

    res.json({
      success: true,
      message: `Idhini za ${targetAdmin.name} zimesasishwa.`,
      admin: sanitizeUser(targetAdmin)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kubadili idhini.' });
  }
});

// Credits & Manual WhatsApp Top-up
router.get('/super-admin/credits/balances', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        businessCategory: u.businessCategory,
        walletBalance: u.walletBalance || 0
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata salio.' });
  }
});

router.post('/super-admin/credits/manual-topup', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const { userId, amountCredits, paymentMethod, paymentReference, notes } = req.body;

    if (!userId || !amountCredits || Number(amountCredits) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali chagua mtumiaji na weka kiasi halali cha credits (nambari chanya).'
      });
    }

    const creditsToAdd = Math.floor(Number(amountCredits));
    const targetUser = await db.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });
    }

    const cleanRef = (paymentReference || `MANUAL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`).trim();
    const reasonText = `Uthibitisho wa malipo ya WhatsApp: ${paymentMethod || 'M-Pesa'} (${cleanRef}) - ${notes || 'Malipo yamehakikiwa'}`;

    const addResult = await db.addCredits(targetUser.id, creditsToAdd, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      reference: cleanRef,
      reason: reasonText,
      relatedAction: 'manual_topup'
    });

    if (!addResult.success) {
      return res.status(400).json({
        success: false,
        message: addResult.error
      });
    }

    await db.addNotification({
      userId: targetUser.id,
      title: 'Credits Zimeongezwa!',
      message: `Hongera! Msimamizi Mkuu amekuongezea Credits ${creditsToAdd.toLocaleString()} kwenye pochi yako. Salio jipya: Credits ${addResult.newBalance?.toLocaleString()}.`,
      type: 'credits'
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'MANUAL_CREDIT_TOPUP',
      target: `User:${targetUser.id}`,
      targetId: targetUser.id,
      details: `Super Admin ${req.user!.name} credited ${creditsToAdd} credits to ${targetUser.name}. Prev: ${addResult.transaction?.balanceBefore}, New: ${addResult.newBalance}. Ref: ${cleanRef}`
    });

    res.json({
      success: true,
      message: `Credits ${creditsToAdd.toLocaleString()} zimeongezwa kikamilifu kwa ${targetUser.name}!`,
      newBalance: addResult.newBalance,
      transaction: addResult.transaction
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuongeza credits.' });
  }
});

router.get('/super-admin/credits/ledger', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const transactions = await db.getTransactions();
    res.json({ success: true, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata orodha ya miamala.' });
  }
});

router.get('/super-admin/credits/config', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const config = await db.getConfig();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata mipangilio ya credits.' });
  }
});

router.put('/super-admin/credits/config', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const { whatsappNumber, postPriceCredits, videoPriceCredits, moviePriceCredits, bundles, termsAndConditions } = req.body;

    const updated = await db.updateConfig({
      whatsappNumber: whatsappNumber?.replace(/[^0-9]/g, '') || undefined,
      postPriceCredits: postPriceCredits ? Number(postPriceCredits) : undefined,
      videoPriceCredits: videoPriceCredits ? Number(videoPriceCredits) : undefined,
      moviePriceCredits: moviePriceCredits ? Number(moviePriceCredits) : undefined,
      bundles: Array.isArray(bundles) ? bundles : undefined,
      termsAndConditions: termsAndConditions?.trim() || undefined
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_CREDIT_CONFIG',
      target: 'SystemConfig',
      details: `Super Admin ${req.user!.name} updated credit config (WhatsApp: ${updated.whatsappNumber}, Post: ${updated.postPriceCredits}cr, Movie: ${updated.moviePriceCredits}cr)`
    });

    res.json({
      success: true,
      message: 'Mipangilio ya credits na WhatsApp imesasishwa kikamilifu.',
      config: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusasisha mipangilio.' });
  }
});

router.get('/super-admin/audit-logs', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    const logs = await db.getAuditLogs(limit);
    res.json({ success: true, auditLogs: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata audit logs.' });
  }
});

router.get('/super-admin/reports', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), async (_req: CleanAuthRequest, res: Response) => {
  try {
    const [users, apps, products, ads, movies, transactions, auditLogs] = await Promise.all([
      db.getUsers(),
      db.getApplications(),
      db.getProducts(),
      db.getAds(),
      db.getMovies(),
      db.getTransactions(),
      db.getAuditLogs(50)
    ]);

    const totalCreditsAdded = transactions
      .filter(t => t.type === 'MANUAL_TOP_UP')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalCreditsSpent = transactions
      .filter(t => t.type === 'DEDUCTION')
      .reduce((acc, t) => acc + t.amount, 0);

    res.json({
      success: true,
      reports: {
        users: {
          total: users.length,
          customers: users.filter(u => u.role === 'CUSTOMER').length,
          admins: users.filter(u => u.role === 'ADMIN').length,
          superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
          active: users.filter(u => u.status === 'ACTIVE').length,
          blocked: users.filter(u => u.status === 'BLOCKED').length
        },
        credits: {
          totalAdded: totalCreditsAdded,
          totalSpent: totalCreditsSpent,
          totalInCirculation: users.filter(u => u.role === 'CUSTOMER').reduce((acc, u) => acc + (u.walletBalance || 0), 0),
          totalTransactions: transactions.length
        },
        applications: {
          total: apps.length,
          approved: apps.filter(a => a.status === 'APPROVED').length,
          rejected: apps.filter(a => a.status === 'REJECTED').length,
          pending: apps.filter(a => a.status === 'PENDING').length
        },
        content: {
          productsTotal: products.length,
          productsApproved: products.filter(p => p.status === 'APPROVED').length,
          adsTotal: ads.length,
          adsApproved: ads.filter(a => a.status === 'APPROVED').length,
          moviesTotal: movies.length,
          moviesApproved: movies.filter(m => m.status === 'APPROVED').length
        },
        recentAuditLogs: auditLogs
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata ripoti.' });
  }
});

// -------------------------------------------------------------
// 5. EXPLICIT PRICING, WHATSAPP & SETTINGS ENDPOINTS (SUPER_ADMIN ONLY)
// -------------------------------------------------------------

// Explicit GET /settings
const handleGetSettings = async (_req: CleanAuthRequest, res: Response) => {
  try {
    const config = await db.getConfig();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata mipangilio.' });
  }
};

router.get('/settings', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), handleGetSettings);
router.get('/super-admin/settings', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), handleGetSettings);

// Explicit PUT /pricing
const handleUpdatePricing = async (req: CleanAuthRequest, res: Response) => {
  try {
    const { postPriceCredits, videoPriceCredits, moviePriceCredits, creditTzsRate } = req.body;
    const currentConfig = await db.getConfig();

    const updatedConfig = await db.updateConfig({
      postPriceCredits: postPriceCredits !== undefined ? Number(postPriceCredits) : currentConfig.postPriceCredits,
      videoPriceCredits: videoPriceCredits !== undefined ? Number(videoPriceCredits) : currentConfig.videoPriceCredits,
      moviePriceCredits: moviePriceCredits !== undefined ? Number(moviePriceCredits) : currentConfig.moviePriceCredits,
      creditTzsRate: creditTzsRate !== undefined ? Number(creditTzsRate) : currentConfig.creditTzsRate
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_PRICING',
      target: 'SystemConfig',
      details: `Super Admin ${req.user!.name} updated pricing: post=${updatedConfig.postPriceCredits}, video=${updatedConfig.videoPriceCredits}, movie=${updatedConfig.moviePriceCredits}`
    });

    res.json({
      success: true,
      message: 'Bei za mfumo zimesasishwa kikamilifu.',
      config: updatedConfig
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusasisha bei.' });
  }
};

router.put('/pricing', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), handleUpdatePricing);
router.put('/super-admin/pricing', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), handleUpdatePricing);

// Explicit PUT /whatsapp
const handleUpdateWhatsApp = async (req: CleanAuthRequest, res: Response) => {
  try {
    const { whatsappNumber } = req.body;
    if (!whatsappNumber || typeof whatsappNumber !== 'string') {
      return res.status(400).json({ success: false, message: 'Weka namba sahihi ya WhatsApp.' });
    }

    const cleanNum = whatsappNumber.replace(/\D/g, '');
    if (!cleanNum.startsWith('255') || cleanNum.length < 12) {
      return res.status(400).json({ success: false, message: 'Namba ya WhatsApp lazima ianze na 255 (mfano 255748604483).' });
    }

    const updatedConfig = await db.updateConfig({
      whatsappNumber: cleanNum
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_WHATSAPP',
      target: 'SystemConfig',
      details: `Super Admin ${req.user!.name} updated WhatsApp number to: ${cleanNum}`
    });

    res.json({
      success: true,
      message: 'Namba ya WhatsApp ya malipo imesasishwa kikamilifu.',
      config: updatedConfig
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusasisha namba ya WhatsApp.' });
  }
};

router.put('/whatsapp', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), handleUpdateWhatsApp);
router.put('/super-admin/whatsapp', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), handleUpdateWhatsApp);

// Explicit PUT /settings
const handleUpdateSettings = async (req: CleanAuthRequest, res: Response) => {
  try {
    const { postPriceCredits, videoPriceCredits, moviePriceCredits, creditTzsRate, whatsappNumber, systemOpen } = req.body;
    const currentConfig = await db.getConfig();

    const patch: Partial<SystemConfig> = {};
    if (postPriceCredits !== undefined) patch.postPriceCredits = Number(postPriceCredits);
    if (videoPriceCredits !== undefined) patch.videoPriceCredits = Number(videoPriceCredits);
    if (moviePriceCredits !== undefined) patch.moviePriceCredits = Number(moviePriceCredits);
    if (creditTzsRate !== undefined) patch.creditTzsRate = Number(creditTzsRate);
    if (whatsappNumber !== undefined) patch.whatsappNumber = String(whatsappNumber).replace(/\D/g, '');
    if (systemOpen !== undefined) patch.systemOpen = Boolean(systemOpen);

    const updatedConfig = await db.updateConfig(patch);

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_SETTINGS',
      target: 'SystemConfig',
      details: `Super Admin ${req.user!.name} updated system config: ${JSON.stringify(patch)}`
    });

    res.json({
      success: true,
      message: 'Mipangilio ya mfumo imesasishwa kikamilifu.',
      config: updatedConfig
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusasisha mipangilio.' });
  }
};

router.put('/settings', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), handleUpdateSettings);
router.put('/super-admin/settings', cleanAuthMiddleware, requireCleanRole('SUPER_ADMIN'), handleUpdateSettings);

// -------------------------------------------------------------
// 6. MEDIA UPLOADS & STREAMING ENDPOINTS
// -------------------------------------------------------------

// Upload media file (Base64 or multipart)
router.post('/media/upload', cleanAuthMiddleware, async (req: CleanAuthRequest, res: Response) => {
  try {
    const { data, filename, type } = req.body || {};
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ success: false, message: 'Data ya faili inahitajika (Base64 format).' });
    }

    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Extract base64 payload
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const base64Data = matches ? matches[2] : data;
    const fileExt = matches ? matches[1].split('/')[1]?.replace('jpeg', 'jpg') || 'bin' : 'bin';

    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${(filename && path.extname(filename).replace('.', '')) || fileExt}`;
    const filePath = path.join(uploadsDir, safeName);

    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));

    const fileUrl = `/data/uploads/${safeName}`;

    res.json({
      success: true,
      message: 'Faili limepakiwa kikamilifu.',
      url: fileUrl,
      filename: safeName
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupakia faili.' });
  }
});

// Authenticated movie streaming URL
router.get('/customer/movies/:id/stream', cleanAuthMiddleware, requireCleanRole('CUSTOMER'), async (req: CleanAuthRequest, res: Response) => {
  try {
    const movieId = getParam(req.params.id);
    const movie = await db.getMovieById(movieId);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Filamu haikupatikana.' });
    }

    if (movie.status !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Filamu hii bado haijakamilisha uhakiki.' });
    }

    // Check if user has authorized this movie stream or is the seller
    const user = req.user!;
    const transactions = await db.getTransactions(user.id);
    const isOwner = movie.sellerId === user.id;
    const hasPaidStream = transactions.some(
      t => t.relatedAction === 'movie_stream' && (t.relatedId === movie.id || t.reference?.includes(movie.id))
    );

    if (!isOwner && !hasPaidStream) {
      return res.status(402).json({
        success: false,
        code: 'PAYMENT_REQUIRED',
        message: 'Unahitaji kuidhinisha utazamaji wa filamu hii kwanza kwa kukatwa credits.'
      });
    }

    // If movie videoUrl is local /data/uploads, stream with range support
    if (movie.videoUrl.startsWith('/data/uploads/')) {
      const fileName = movie.videoUrl.replace('/data/uploads/', '');
      const filePath = path.join(process.cwd(), 'data', 'uploads', fileName);

      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(filePath, { start, end });
          const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          };
          res.writeHead(206, head);
          file.pipe(res);
          return;
        } else {
          const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
          };
          res.writeHead(200, head);
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }
    }

    // Otherwise redirect to external URL safely
    res.json({
      success: true,
      videoUrl: movie.videoUrl,
      title: movie.title
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufungua filamu.' });
  }
});

export default router;
