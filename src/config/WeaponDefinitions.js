class WeaponDefinition {
  constructor(config) {
    this.name = config.name;
    this.modelPath = config.modelPath;

    this.parts = {
      magazine: config.parts?.magazine || null,
      chargingHandle: config.parts?.chargingHandle || null,
      slide: config.parts?.slide || null,
      bolt: config.parts?.bolt || null,
      trigger: config.parts?.trigger || null,
    };

    this.animations = {
      reload: {
        duration: config.animations?.reload?.duration || 2.0,
        magDropStart: config.animations?.reload?.magDropStart || 0.0,
        magDropEnd: config.animations?.reload?.magDropEnd || 0.25,
        magInsertStart: config.animations?.reload?.magInsertStart || 0.4,
        magInsertEnd: config.animations?.reload?.magInsertEnd || 0.65,
        chargeStart: config.animations?.reload?.chargeStart || 0.65,
        chargeEnd: config.animations?.reload?.chargeEnd || 0.85,
        magDropDistance: config.animations?.reload?.magDropDistance || 0.5,
        magDropSideways: config.animations?.reload?.magDropSideways || 0.0,
        magDropRotation: config.animations?.reload?.magDropRotation || 0.3,
        magDropTwist: config.animations?.reload?.magDropTwist || 0.0,
        chargeDistance: config.animations?.reload?.chargeDistance || 0.03,
        chargeAxis: config.animations?.reload?.chargeAxis || 'z',
      },
      fire: {
        recoilAmount: config.animations?.fire?.recoilAmount || 0.1,
        recoilRecoverySpeed: config.animations?.fire?.recoilRecoverySpeed || 5,
        recoilVariation: config.animations?.fire?.recoilVariation || 0.2,
        horizontalRecoil: config.animations?.fire?.horizontalRecoil || 0.05,
        horizontalVariation:
          config.animations?.fire?.horizontalVariation || 0.5,
        verticalRecoil: config.animations?.fire?.verticalRecoil || 0.08,
        verticalVariation: config.animations?.fire?.verticalVariation || 0.3,
      },
    };

    this.stats = {
      damage: config.stats?.damage || 35,
      fireRate: config.stats?.fireRate || 0.1,
      magazineSize: config.stats?.magazineSize || 30,
      reloadTime: config.stats?.reloadTime || 2.0,
    };
  }
}

const WeaponDefinitions = {
  ak47: new WeaponDefinition({
    name: 'AK-47',
    modelPath: '/src/assets/models/weapons/Weapon_02.fbx',
    parts: {
      magazine: 'Weapon_02_2',
      chargingHandle: 'Weapon_02_4',
      body: 'Weapon_02',
      stock: 'Weapon_02_7',
      sights: 'Weapon_02_5',
    },
    animations: {
      reload: {
        duration: 2.5,
        magDropStart: 0.0,
        magDropEnd: 0.2,
        magInsertStart: 0.5,
        magInsertEnd: 0.75,
        chargeStart: 0.75,
        chargeEnd: 0.9,
        magDropDistance: 50,
        magDropSideways: 5,
        magDropRotation: 0.3,
        magDropTwist: 0.1,
        chargeDistance: -4,
        chargeAxis: 'x',
      },
      fire: {
        recoilAmount: 0.12,
        recoilRecoverySpeed: 1,
        recoilVariation: 0.3,
        horizontalRecoil: 0.05,
        horizontalVariation: 0.8,
        verticalRecoil: 0.08,
        verticalVariation: 0.4,
      },
    },
    stats: {
      damage: 35,
      fireRate: 0.1,
      magazineSize: 30,
      reloadTime: 2.5,
    },
  }),

  pistol: new WeaponDefinition({
    name: 'Pistol',
    modelPath: '/src/assets/models/weapons/Weapon_01.fbx',
    parts: {
      magazine: 'Pistol_Magazine',
      slide: 'Pistol_Slide',
    },
    animations: {
      reload: {
        duration: 1.5,
        magDropStart: 0.0,
        magDropEnd: 0.3,
        magInsertStart: 0.4,
        magInsertEnd: 0.7,
        chargeStart: 0.7,
        chargeEnd: 0.9,
      },
      fire: {
        recoilAmount: 0.08,
        recoilRecoverySpeed: 8,
      },
    },
    stats: {
      damage: 25,
      fireRate: 0.3,
      magazineSize: 12,
      reloadTime: 1.5,
    },
  }),
};

export { WeaponDefinition, WeaponDefinitions };
