// ====================================================================
// CORE ARCHITECTURE JAVASCRIPT MODULE - NORTH BENGAL HEALTHCARE APP
// ====================================================================

// 1. Database Credentials Initialize
const SUPABASE_URL = "https://hacapddopupfpobgciyk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhY2FwZGRvcHVwZnBvYmdjaXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDQzMTEsImV4cCI6MjA5NDkyMDMxMX0.44h0mVBrx3xjm4o0Zdh7jez15TUsxdXlQc86rsFaLAU";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. North Bengal Dataset Maps (Enum Support)
const NORTH_BENGAL_CITIES = ['Cooch Behar', 'Siliguri', 'Darjeeling', 'Tufanganj', 'Dinhata', 'Mekhliganj', 'Alipurduar', 'Jalpaiguri', 'Mathabhanga'];
let categoriesCache = [];

// 3. Application State Lifecycles
let currentModule = "dashboard";

window.addEventListener('DOMContentLoaded', async () => {
  initAuthStatus();
  setupGlobalEvents();
});

// Verification and Route Guard
async function initAuthStatus() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    document.getElementById('login-screen').classList.remove('hidden');
  } else {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-display-email').innerText = session.user.email;
    await syncCategories();
    switchTab('dashboard');
  }
}

function setupGlobalEvents() {
  // Login Submitting
  document.getElementById('btn-submit-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-submit-login');
    
    btn.innerText = "যাচাই করা হচ্ছে..."; btn.disabled = true;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন।");
      btn.innerText = "প্রবেশ করুন"; btn.disabled = false;
    } else {
      initAuthStatus();
    }
  });

  // Logout Submitting
  document.getElementById('btn-logout').addEventListener('click', async () => {
    if(confirm("আপনি কি প্যানেল থেকে লগআউট করতে চান?")) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  });
}

async function syncCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('order_index', { ascending: true });
  if(!error) {
    categoriesCache = data;
  }
}

// 4. Tab Core View Management Switching
async function switchTab(moduleName) {
  currentModule = moduleName;
  
  document.querySelectorAll('#main-sidebar nav button').forEach(el => el.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-${moduleName}`);
  if(activeBtn) activeBtn.classList.add('active');

  const container = document.getElementById('view-container');
  const title = document.getElementById('view-title');

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-24">
      <span class="loading loading-spinner text-blue-600 loading-lg"></span>
      <p class="text-xs text-slate-400 mt-2">ডাটাবেস থেকে তথ্য আনা হচ্ছে...</p>
    </div>`;

  if (moduleName === 'dashboard') {
    title.innerText = "ড্যাশবোর্ড ওভারভিউ";
    await renderDashboardView(container);
  } else if (moduleName === 'hospitals') {
    title.innerText = "ক্যাটাগরি / স্পেশালিটি ম্যানেজমেন্ট"; // আমরা এই মডিউলটিকে সরাসরি ক্যাটাগরি কন্ট্রোলে রূপান্তর করলাম যেন প্যানেল থেকে এডিট করা যায়
    await renderCategoriesView(container);
  } else if (moduleName === 'doctors') {
    title.innerText = "ডাক্তার প্রোফাইল ম্যানেজমেন্ট";
    await renderDoctorsView(container);
  } else if (moduleName === 'reviews') {
    title.innerText = "ইউজার রিভিউ মডারেশন";
    await renderReviewsView(container);
  } else {
    container.innerHTML = `<div class="text-center py-20 text-slate-400 text-sm">এই মডিউলটির ডেভেলপমেন্ট কাজ চলছে... খুব দ্রুত লাইভ হবে।</div>`;
  }
}

// ====================================================================
// MODULE ENGINE: DASHBOARD METRICS VIEW
// ====================================================================
async function renderDashboardView(target) {
  const { count: docCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
  const { count: chamberCount } = await supabase.from('chambers').select('*', { count: 'exact', head: true });
  const { count: reviewCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true, filter: `is_approved.eq.false` });
  const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });

  if(reviewCount > 0) {
    const badge = document.getElementById('review-badge');
    badge.innerText = reviewCount; badge.classList.remove('hidden');
  }

  target.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-gradient-to-br from-blue-50 to-blue-100/30 p-5 rounded-xl border border-blue-100/70">
        <p class="text-xs font-semibold text-blue-600 uppercase tracking-wider">মোট ক্যাটাগরি</p>
        <h3 class="text-3xl font-bold text-slate-800 mt-1">${catCount || 0}টি মডিউল</h3>
      </div>
      <div class="bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-5 rounded-xl border border-indigo-100/70">
        <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">মোট ডাটাবেস ডাক্তার</p>
        <h3 class="text-3xl font-bold text-slate-800 mt-1">${docCount || 0} জন</h3>
      </div>
      <div class="bg-gradient-to-br from-teal-50 to-teal-100/30 p-5 rounded-xl border border-teal-100/70">
        <p class="text-xs font-semibold text-teal-600 uppercase tracking-wider">সক্রিয় চেম্বার লিংকস</p>
        <h3 class="text-3xl font-bold text-slate-800 mt-1">${chamberCount || 0}টি</h3>
      </div>
      <div class="bg-gradient-to-br from-amber-50 to-amber-100/30 p-5 rounded-xl border border-amber-100/70">
        <p class="text-xs font-semibold text-amber-600 uppercase tracking-wider">পেন্ডিং রিভিউ মডারেশন</p>
        <h3 class="text-3xl font-bold text-slate-800 mt-1">${reviewCount || 0}টি জমা</h3>
      </div>
    </div>`;
}

// ====================================================================
// 🆕 MODULE ENGINE: CATEGORY MANAGEMENT (ADD, EDIT, DELETE FROM PANEL)
// ====================================================================
async function renderCategoriesView(target) {
  await syncCategories();

  let rows = '';
  if(categoriesCache && categoriesCache.length > 0) {
    categoriesCache.forEach(cat => {
      rows += `
        <tr class="border-b border-slate-100 text-slate-700 text-xs">
          <td class="font-bold">${cat.name_bn}</td>
          <td>${cat.name_en}</td>
          <td><code>${cat.slug}</code></td>
          <td>${cat.order_index}</td>
          <td class="text-end">
            <button onclick="deleteCategory('${cat.id}')" class="btn btn-xs btn-ghost text-red-500">ডিলিট</button>
          </td>
        </tr>`;
    });
  } else {
    rows = `<tr><td colspan="5" class="text-center text-slate-400 py-8">কোনো ক্যাটাগরি নেই। বামপাশ থেকে তৈরি করুন।</td></tr>`;
  }

  target.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100 h-fit">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">নতুন ক্যাটাগরি / স্পেশালিটি এন্ট্রি</h3>
        <form id="form-add-category" onsubmit="saveCategoryData(event)" class="space-y-3">
          <div>
            <label class="label p-1 text-[11px] font-bold text-slate-600">ক্যাটাগরি নাম (বাংলা) *</label>
            <input type="text" id="cat-name-bn" placeholder="উদা: হৃদরোগ বিশেষজ্ঞ" class="input input-bordered input-sm w-full bg-white text-slate-800" required />
          </div>
          <div>
            <label class="label p-1 text-[11px] font-bold text-slate-600">ক্যাটাগরি নাম (English) *</label>
            <input type="text" id="cat-name-en" placeholder="Eg: Cardiologist" class="input input-bordered input-sm w-full bg-white text-slate-800" required />
          </div>
          <div>
            <label class="label p-1 text-[11px] font-bold text-slate-600">URL স্ল্যাগ (Slug - ছোট হাতের ইংরেজি) *</label>
            <input type="text" id="cat-slug" placeholder="উদা: cardiology" class="input input-bordered input-sm w-full bg-white text-slate-800 text-xs" required />
          </div>
          <div>
            <label class="label p-1 text-[11px] font-bold text-slate-600">সিরিয়াল অর্ডার ইন্ডেক্স (সংখ্যা) *</label>
            <input type="number" id="cat-order" value="1" class="input input-bordered input-sm w-full bg-white text-slate-800" required />
          </div>
          <button type="submit" id="btn-save-cat" class="btn btn-primary btn-sm w-full text-white bg-blue-600">ক্যাটাগরি সেভ করুন</button>
        </form>
      </div>
      <div class="lg:col-span-2 overflow-x-auto">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">বিদ্যমান ক্যাটাগরি তালিকা</h3>
        <table class="table w-full">
          <thead>
            <tr class="bg-slate-50 text-slate-600 text-xs">
              <th>নাম (বাংলা)</th><th>Name (English)</th><th>Slug</th><th>অর্ডার</th><th class="text-end">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

async function saveCategoryData(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-cat');
  btn.innerText = "সংরক্ষণ হচ্ছে..."; btn.disabled = true;

  const nameBn = document.getElementById('cat-name-bn').value;
  const nameEn = document.getElementById('cat-name-en').value;
  const slug = document.getElementById('cat-slug').value.toLowerCase().trim();
  const orderIndex = parseInt(document.getElementById('cat-order').value) || 1;

  const { error } = await supabase.from('categories').insert([{
    name_bn: nameBn, name_en: nameEn, slug: slug, order_index: orderIndex, is_active: true
  }]);

  if(!error) {
    alert("নতুন ক্যাটাগরি সফলভাবে প্যানেল থেকে তৈরি হয়েছে!");
    await syncCategories();
    switchTab('hospitals');
  } else {
    alert("ত্রুটি: " + error.message);
    btn.innerText = "ক্যাটাগরি সেভ করুন"; btn.disabled = false;
  }
}

async function deleteCategory(id) {
  if(confirm("ক্যাটাগরি ডিলিট করলে এর সাথে লিংকড সমস্ত ডাক্তার বা ডাটাবেস এফেক্টেড হতে পারে। আপনি কি নিশ্চিত?")) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if(!error) {
      await syncCategories();
      switchTab('hospitals');
    }
  }
}

// ====================================================================
// MODULE ENGINE: DOCTOR & CHAMBER INTERFACE MANAGEMENT
// ====================================================================
async function renderDoctorsView(target) {
  await syncCategories();
  const { data: doctorsList } = await supabase.from('doctors').select('*').order('created_at', { ascending: false });

  let tableRows = '';
  if(doctorsList && doctorsList.length > 0) {
    doctorsList.forEach(doc => {
      tableRows += `
        <tr class="border-b border-slate-100 text-slate-700 hover:bg-slate-50/50">
          <td>
            <div class="flex items-center gap-3">
              <div class="avatar">
                <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <img src="${doc.image_url || 'https://via.placeholder.com/150'}" alt="Doc">
                </div>
              </div>
              <div>
                <div class="font-bold text-xs">${doc.name_bn}</div>
                <div class="text-[10px] text-slate-400">${doc.name_en}</div>
              </div>
            </div>
          </td>
          <td class="text-xs font-semibold">${doc.degree}</td>
          <td><span class="badge badge-sm bg-blue-50 text-blue-700 border-blue-100">${doc.is_featured ? 'Featured' : 'Regular'}</span></td>
          <td class="flex gap-1 justify-end mt-2">
            <button onclick="openChamberModal('${doc.id}', '${doc.name_bn}')" class="btn btn-xs btn-outline btn-primary text-[10px]">➕ চেম্বার</button>
            <button onclick="deleteDoctor('${doc.id}')" class="btn btn-xs btn-ghost text-red-500 text-[10px]">ডিলিট</button>
          </td>
        </tr>`;
    });
  } else {
    tableRows = `<tr><td colspan="4" class="text-center text-slate-400 py-8 text-xs">ডাটাবেসে কোনো ডাক্তারের প্রোফাইল পাওয়া যায়নি! প্রথমে বামপাশ থেকে ক্যাটাগরি বানিয়ে ডাক্তার যোগ করুন।</td></tr>`;
  }

  // Check if categories exist, if not alert user to add category first
  const categoryOptions = categoriesCache.length > 0 
    ? categoriesCache.map(cat => `<option value="${cat.id}">${cat.name_bn}</option>`).join('')
    : `<option value="">প্রথমে ক্যাটাগরি তৈরি করুন!</option>`;

  target.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100 h-fit">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">নতুন ডাক্তার ডাটা এন্ট্রি</h3>
        <form id="form-add-doctor" onsubmit="saveDoctorData(event)" class="space-y-3">
          <div>
            <label class="label p-1 text-[11px] font-bold text-slate-600">ডাক্তারের নাম (বাংলায়) *</label>
            <input type="text" id="doc-name-bn" class="input input-bordered input-sm w-full bg-white text-slate-800" required />
          </div>
          <div>
            <label class="label p-1 text-[11px] font-bold text-slate-600">ডাক্তারের নাম (English) *</label>
            <input type="text" id="doc-name-en" class="input input-bordered input-sm w-full bg-white text-slate-800" required />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="label p-1 text-[11px] font-bold text-slate-600">স্পেশালিটি / ক্যাটাগরি *</label>
              <select id="doc-category" class="select select-bordered select-sm w-full bg-white text-slate-800 text-xs" required>
                ${categoryOptions}
              </select>
            </div>
            <div>
              <label class="label p-1 text-[11px] font-bold text-slate-600">ডিগ্রীসমূহ *</label>
              <input type="text" id="doc-degree" placeholder="MBBS, MD" class="input input-bordered input-sm w-full bg-white text-slate-800" required />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="label p-1 text-[11px] font-bold text-slate-600">অভিজ্ঞতা (বছর)</label>
              <input type="number" id="doc-exp" value="0" class="input input-bordered input-sm w-full bg-white text-slate-800" />
            </div>
            <div>
              <label class="label p-1 text-[11px] font-bold text-slate-600">প্রোফাইল পিকচার</label>
              <input type="file" id="doc-file" accept="image/*" class="file-input file-input-bordered file-input-sm w-full bg-white" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="label p-1 text-[11px] font-bold text-slate-600">Fuzzy Search ডাকনাম (Alias)</label>
              <input type="text" id="doc-aliases" placeholder="Pikedas, pikeroy" class="input input-bordered input-sm w-full bg-white text-slate-800 text-xs" />
            </div>
            <div>
              <label class="label p-1 text-[11px] font-bold text-slate-600">সার্চ ট্যাগস (কমা দিয়ে)</label>
              <input type="text" id="doc-tags" placeholder="heart, বুকে ব্যথা" class="input input-bordered input-sm w-full bg-white text-slate-800 text-xs" />
            </div>
          </div>
          <div class="flex items-center gap-4 py-1">
            <label class="label cursor-pointer gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" id="doc-featured" class="checkbox checkbox-primary checkbox-sm" /> হোমপেজ ফিচার্ড?
            </label>
          </div>
          <button type="submit" id="btn-save-doc" class="btn btn-primary btn-sm w-full text-white bg-blue-600">সংরক্ষণ করুন</button>
        </form>
      </div>

      <div class="lg:col-span-2 overflow-x-auto">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">নিবন্ধিত ডাক্তারদের তালিকা</h3>
        <table class="table w-full">
          <thead>
            <tr class="bg-slate-50 text-slate-600 text-xs border-b border-slate-100">
              <th>ডাক্তার</th><th>ডিগ্রী</th><th>স্ট্যাটাস</th><th class="text-end">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>`;
}

async function saveDoctorData(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-doc');
  
  if(!document.getElementById('doc-category').value) {
    alert("দয়া করে আগে ড্যাশবোর্ডের ক্যাটাগরি মডিউল থেকে অন্তত ১টি ক্যাটাগরি বা স্পেশালিটি তৈরি করুন!");
    return;
  }

  btn.innerText = "সংরক্ষণ হচ্ছে..."; btn.disabled = true;

  const nameBn = document.getElementById('doc-name-bn').value;
  const nameEn = document.getElementById('doc-name-en').value;
  const categoryId = document.getElementById('doc-category').value;
  const degree = document.getElementById('doc-degree').value;
  const experience = parseInt(document.getElementById('doc-exp').value) || 0;
  const isFeatured = document.getElementById('doc-featured').checked;
  const aliases = document.getElementById('doc-aliases').value.split(',').map(s => s.trim()).filter(Boolean);
  const tags = document.getElementById('doc-tags').value.split(',').map(s => s.trim()).filter(Boolean);
  const fileInput = document.getElementById('doc-file');

  let imageUrl = null;

  try {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const fileName = `${Math.random()}_${Date.now()}.${file.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage.from('doctor-avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('doctor-avatars').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000);

    const { error: insertError } = await supabase.from('doctors').insert([{
      name_bn: nameBn, name_en: nameEn, category_id: categoryId, slug: slug,
      degree: degree, experience: experience, is_featured: isFeatured,
      search_aliases: aliases, tags: tags, image_url: imageUrl, verified: 'verified'
    }]);

    if (insertError) throw insertError;

    alert("সফলভাবে নতুন ডাক্তারের প্রোফাইল ডাটাবেসে সেভ হয়েছে!");
    switchTab('doctors');
  } catch (err) {
    alert("ত্রুটি: " + err.message);
    btn.innerText = "সংরক্ষণ করুন"; btn.disabled = false;
  }
}

async function deleteDoctor(id) {
  if(confirm("আপনি কি নিশ্চিতভাবে এই ডাক্তারকে মুছে ফেলতে চান? তাঁর সাথে যুক্ত সমস্ত চেম্বারও কিন্তু স্বয়ংক্রিয়ভাবে মুছে যাবে!")) {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if(!error) switchTab('doctors');
  }
}

function openChamberModal(docId, docName) {
  document.getElementById('chamber-doc-id').value = docId;
  document.getElementById('modal-doc-title').innerText = `${docName} — নতুন চেম্বার লিংক`;
  
  const citySelect = document.getElementById('cham-city');
  citySelect.innerHTML = NORTH_BENGAL_CITIES.map(c => `<option value="${c}">${c}</option>`).join('');

  document.getElementById('form-add-chamber').reset();
  document.getElementById('chamber-modal').showModal();
}

async function saveChamberData(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-chamber');
  btn.innerText = "সংরক্ষণ হচ্ছে..."; btn.disabled = true;

  const doctorId = document.getElementById('chamber-doc-id').value;
  const chamberName = document.getElementById('cham-name').value;
  const city = document.getElementById('cham-city').value;
  const area = document.getElementById('cham-area').value;
  const address = document.getElementById('cham-address').value;
  const fees = parseInt(document.getElementById('cham-fees').value);
  const whatsapp = document.getElementById('cham-whatsapp').value;
  const phoneArray = document.getElementById('cham-phone').value.split(',').map(s => s.trim()).filter(Boolean);
  
  let timingJSON = {};
  try {
    timingJSON = JSON.parse(document.getElementById('cham-timing').value);
  } catch(e) {
    alert("সময় টাইমিং বিন্যাস সঠিক নয়! সঠিক JSON টেক্সট দিন।");
    btn.innerText = "সেভ চেম্বার"; btn.disabled = false;
    return;
  }

  const { error } = await supabase.from('chambers').insert([{
    doctor_id: doctorId, chamber_name: chamberName, city: city, area: area,
    address: address, fees: fees, phone: phoneArray, whatsapp: whatsapp, timing: timingJSON
  }]);

  if(!error) {
    alert("চেম্বার ম্যাপিং সফল হয়েছে!");
    document.getElementById('chamber-modal').close();
    switchTab('doctors');
  } else {
    alert("ভুল হয়েছে: " + error.message);
    btn.innerText = "সেভ চেম্বার"; btn.disabled = false;
  }
}

// ====================================================================
// MODULE ENGINE: USER REVIEWS MODERATION
// ====================================================================
async function renderReviewsView(target) {
  const { data: reviewList } = await supabase
    .from('reviews')
    .select(`id, user_name, rating, review_text, is_approved, created_at, doctors(name_bn)`)
    .order('is_approved', { ascending: true });

  let listHtml = '';
  if(reviewList && reviewList.length > 0) {
    reviewList.forEach(rev => {
      const dateStr = new Date(rev.created_at).toLocaleDateString('bn-BD');
      listHtml += `
        <div class="p-4 rounded-xl border ${rev.is_approved ? 'bg-slate-50 border-slate-100' : 'bg-amber-50/40 border-amber-100'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-700">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs">${rev.user_name}</span>
              <span class="text-amber-500 text-xs">${'★'.repeat(rev.rating)}${ '☆'.repeat(5-rev.rating)}</span>
              <span class="text-[10px] text-slate-400">ডাক্তার: ${rev.doctors ? rev.doctors.name_bn : 'N/A'}</span>
            </div>
            <p class="text-xs text-slate-600 italic">"${rev.review_text}"</p>
            <p class="text-[9px] text-slate-400">তারিখ: ${dateStr}</p>
          </div>
          <div class="flex gap-1">
            ${!rev.is_approved ? `<button onclick="approveReview('${rev.id}')" class="btn btn-xs btn-success text-white px-3">অ্যাপ্রুভ</button>` : `<span class="badge badge-sm badge-success text-white gap-1">লাইভ</span>`}
            <button onclick="deleteReview('${rev.id}')" class="btn btn-xs btn-ghost text-red-500">ডিলিট</button>
          </div>
        </div>`;
    });
  } else {
    listHtml = `<div class="text-center py-12 text-slate-400 text-xs">মডারেশন করার মতো কোনো ইউজার রিভিউ এই মুহূর্তে নেই!</div>`;
  }
  target.innerHTML = `<div class="space-y-3">${listHtml}</div>`;
}

async function approveReview(id) {
  const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
  if(!error) {
    alert("রিভিউটি সফলভাবে অ্যাপ্রুভড করা হয়েছে!");
    const { count } = await supabase.from('reviews').select('*', { count: 'exact', head: true, filter: `is_approved.eq.false` });
    const badge = document.getElementById('review-badge');
    if(count > 0) { badge.innerText = count; } else { badge.classList.add('hidden'); }
    switchTab('reviews');
  }
}

async function deleteReview(id) {
  if(confirm("আপনি কি এই রিভিউটি ডাটাবেস থেকে মুছে ফেলতে চান?")) {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if(!error) switchTab('reviews');
  }
}
