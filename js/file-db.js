const BL_FILE_DB_NAME = 'ben_learning_files';
const BL_FILE_DB_VERSION = 1;
const BL_FILE_STORE = 'course_files';

function openCourseFileDb(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(BL_FILE_DB_NAME,BL_FILE_DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(BL_FILE_STORE)) db.createObjectStore(BL_FILE_STORE,{keyPath:'key'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function saveCourseFile(key,file){
  const db=await openCourseFileDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(BL_FILE_STORE,'readwrite');
    tx.objectStore(BL_FILE_STORE).put({
      key,
      blob:file,
      name:file.name,
      type:file.type || 'application/octet-stream',
      size:file.size,
      savedAt:new Date().toISOString()
    });
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}

async function getCourseFile(key){
  const db=await openCourseFileDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(BL_FILE_STORE,'readonly');
    const req=tx.objectStore(BL_FILE_STORE).get(key);
    req.onsuccess=()=>resolve(req.result || null);
    req.onerror=()=>reject(req.error);
    tx.oncomplete=()=>db.close();
  });
}

async function deleteCourseFile(key){
  if(!key) return;
  const db=await openCourseFileDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(BL_FILE_STORE,'readwrite');
    tx.objectStore(BL_FILE_STORE).delete(key);
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
