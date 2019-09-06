const clientMediaDB = () => {
    /**
     * PRIVATE (variables, class, functions)
     *
     *
     *
     */
    const _dbName = 'MediaDB';
    const _dbVersion = 1;
    const _indexs = [{ src: true }, { name: true }, { ext: false }, { blob: false }];
    let _totalKb = 0;
    let _currentKb = 0;
  
  
    /**
     * DB functions
     */
    const open = cb => {
      const indexedDB =
        window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
      const _db = indexedDB.open(_dbName, _dbVersion);
  
      _db.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(_dbName)) {
          const objectStore = db.createObjectStore(_dbName, { keyPath: 'src' });
  
          _indexs.forEach(index => {
            const name = Object.keys(index)[0];
            const unique = Object.values(index)[0];
            objectStore.createIndex(name, name, { unique });
          });
        }
      };
  
      _db.onsuccess = e => {
        cb(null, e.target.result);
      };
  
      _db.onerror = e => {
        cb(e);
      };
      return;
    };
  
    const close = db => {
      db.transaction(_dbName, 'readwrite').oncomplete = () => {
        db.close();
      };
    };
  
    const getStore = db => {
      return db.transaction(_dbName, 'readwrite').objectStore(_dbName);
    };
  
    /**
     * BLOB
     */
    const setProgress = (current, total) => {
      _currentKb += current || 0;
      _totalKb += total || 0;
    };
  
    const getItemBlob = src => {
      let itemPromise = fetch(src)
        .then(res => {
          if (!res.ok) throw Error(`${res.status} ${res.statusText}`);
          if (!res.body) throw Error('ReadableStream not yet supported in this browser.');
          const contentLength = res.headers.get('content-length');
          if (!contentLength) throw Error('Content-Length response-header unavailable');
  
          // setProgress(0, contentLength * 1);
  
          return new Response(
            new ReadableStream({
              start(ctrl) {
                const reader = res.body.getReader();
  
                const read = () => {
                  reader
                    .read()
                    .then(({ done, value }) => {
                      if (done) {
                        ctrl.close();
                        return;
                      }
  
                      // setProgress(value.byteLength, 0);
                      ctrl.enqueue(value);
                      read();
                    })
                    .catch(error => {
                      ctrl.error(error);
                    });
                };
                read();
              }
            })
          );
        })
        .then(res => res.blob());
  
      return itemPromise;
    };
  
    const setItem = ({ file, blob }) => {
      let obj = {};
      let arr1 = file.split('/');
      let arr2 = arr1[arr1.length - 1].split('.');
  
      obj.src = file;
      obj.name = arr1[arr1.length - 1];
      obj.ext = arr2[arr2.length - 1];
      obj.blob = blob;
  
      return obj;
    };
  
    /**
     * PUBLIC (methods)
     *
     *
     *
     */
    return {
      save(file, cb) {
        open((err, db) => {
          if (err) {
            cb(err);
          }
          const store = getStore(db);
          const obj = getItemInfos(file);
          let res = store.put({ ...obj });
  
          res.onsuccess = e => {
            cb(null, e);
          };
          res.onerror = e => {
            cb(e);
          };
          close(db);
        });
      },
  
      load(src, cb) {
        open((err, db) => {
          if (err) {
            cb(err);
          }
          const store = getStore(db);
          const data = store.get(src);
  
          data.onsuccess = e => {
            cb(null, e.target.result);
          };
  
          data.onerror = e => {
            cb(e);
          };
  
          close(db);
        });
      },
  
      saveAll(files, cb) {
        let inc = 0;
        let cache = [];
  
        Promise.all(files.map(file => getItemBlob(file))).then(function(blobList) {
          open((err, db) => {
            if (err) cb(err);
            const store = getStore(db);
  
            blobList.forEach((blob, i) => {
              const file = files[i];
              const obj = setItem({ file, blob });
  
              const putNextItem = () => {
                if (inc < files.length) {
                  const res = store.put({ ...obj });
                  res.onsuccess = putNextItem;
                  inc++;
                } else {
                  close(db);
                  cb(null, `[${files}] stored`);
                }
              };
              putNextItem();
            });
          });
        });
      }
    };
  };
  
  export default clientMediaDB;
  
  // whitout fetch
  // saveAll(files, cb) {
  //   let inc = 0;
  
  //   open((err, db) => {
  //     if (err) {
  //       cb(err);
  //     }
  //     const store = getStore(db);
  //     files.forEach(file => {
  //       const putNextItem = () => {
  //         if (inc < files.length) {
  //           const obj = setItem(file);
  //           let res = store.put({ ...obj });
  
  //           res.onsuccess = putNextItem;
  //           inc++;
  //         } else {
  //           cb(null, `${files} stored`);
  //         }
  //       };
  //       putNextItem();
  //     });
  //     close(db);
  //   });
  // },
  
  