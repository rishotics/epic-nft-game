import {
    CharacterProps,
    BigBoss,
    AttackProps,
    SpecialAttackProps
} from "./contracts";

export const parseDefaultCharacter (data: any): CharacterProps => {
    var res: CharacterProps = {
        attacks: data.attacks,
        characterIndex: data.characterIndex,
        hp: data.hp,
        imageURI: data.imageURI,
        maxHp: data.maxHp,
        name: data.name,
        specialAttacks: data.specialAttacks,
        lastRegenTime: data.lastRegenTime,
        tokenId: data.tokenId, //where is the tokenId coming from
    };
    return res;
};

export const parseBossData (data: any): BigBoss => {
    var res: BigBoss = {
        attackDamage: data.attackDamage,
        imageURI: data.imageURI,
        hp: data.hp,
        maxHp: data.maxHp,
        name: data.name,
      };
      return res;
}


export const parseAttacks = (data: any): AttackProps => {
    var res: AttackProps = {
      attackDamage: data.attackDamage,
      attackIndex: data.attackIndex,
      attackImage: data.attackImage,
      attackName: data.attackName,
    };
    return res;
  };

  export const parseSpecialAttacks = (data: any): SpecialAttackProps => {
    var res: SpecialAttackProps = {
      price: data.price,
      specialAttackDamage: data.specialAttackDamage,
      specialAttackIndex: data.specialAttackIndex,
      specialAttackImage: data.specialAttackImage,
      specialAttackName: data.specialAttackName,
    };
    return res;
  };