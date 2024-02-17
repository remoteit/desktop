import localForage from 'localforage'

async function cleanupOldLocalStorage() {
  // Wait for localForage to initialize and set its driver
  await localForage.ready()

  // Check if the current driver is IndexedDB
  if (localForage.driver() === localForage.INDEXEDDB) {
    console.log('IndexedDB is supported and in use.')

    // Perform the cleanup in localStorage
    localStorage.removeItem('persist:app')
    console.log('Old localStorage data removed.')
  } else {
    console.log('IndexedDB is not supported or not in use, skipping cleanup.')
  }
}

// Call this function early in your application's initialization process
cleanupOldLocalStorage()
