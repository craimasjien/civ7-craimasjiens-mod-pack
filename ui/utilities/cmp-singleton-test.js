class CmpSingletonTest {
    constructor() {
        engine.on('open-civilopedia', this.onOpenCivilopedia);
    }
    
    onOpenCivilopedia() {
        console.error('open-civilopedia');
    }
}
const CmpSingleton = new CmpSingletonTest();
export default CmpSingleton;
