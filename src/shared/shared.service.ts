/*
 * @Author: Sheng.Jiang
 * @Date: 2021-12-08 17:14:57
 * @LastEditTime: 2022-10-05 23:23:12
 * @LastEditors: Please set LastEditors
 * @Description: Phương pháp công khai
 *
 * @FilePath: /meimei-admin/src/shared/shared.service.ts
 * You can you up，no can no bb！！
 */

import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import { customAlphabet, nanoid } from 'nanoid';
import { Request } from 'express';
import axios from 'axios';
import * as iconv from 'iconv-lite';

@Injectable()
export class SharedService {
  /**
   * Xây dựng dữ liệu cấu trúc cây
   */
  public handleTree(
    data: any[],
    id?: string,
    parentId?: string,
    children?: string,
  ) {
    const config = {
      id: id || 'id',
      parentId: parentId || 'parentId',
      childrenList: children || 'children',
    };

    const childrenListMap = {};
    const nodeIds = {};
    const tree = [];

    for (const d of data) {
      const parentId = d[config.parentId];
      if (childrenListMap[parentId] == null) {
        childrenListMap[parentId] = [];
      }
      nodeIds[d[config.id]] = d;
      childrenListMap[parentId].push(d);
    }

    for (const d of data) {
      const parentId = d[config.parentId];
      if (nodeIds[parentId] == null) {
        tree.push(d);
      }
    }

    for (const t of tree) {
      adaptToChildrenList(t);
    }

    function adaptToChildrenList(o) {
      if (childrenListMap[o[config.id]] !== null) {
        o[config.childrenList] = childrenListMap[o[config.id]];
      }
      if (o[config.childrenList]) {
        for (const c of o[config.childrenList]) {
          adaptToChildrenList(c);
        }
      }
    }
    return tree;
  }

  /* Có được một yêu cầu IP */
  getReqIP(req: Request): string {
    return (
      // Xác định xem có proxy ngược không IP
      (
        (req.headers['x-forwarded-for'] as string) ||
        // Phán quyết socket của IP
        req.socket.remoteAddress ||
        ''
      ).replace('::ffff:', '')
    );
  }

  /* Phán quyết IP Nó có phải là một mạng bên trong không */
  IsLAN(ip: string) {
    ip.toLowerCase();
    if (ip == 'localhost') return true;
    let a_ip = 0;
    if (ip == '') return false;
    const aNum = ip.split('.');
    if (aNum.length != 4) return false;
    a_ip += parseInt(aNum[0]) << 24;
    a_ip += parseInt(aNum[1]) << 16;
    a_ip += parseInt(aNum[2]) << 8;
    a_ip += parseInt(aNum[3]) << 0;
    a_ip = (a_ip >> 16) & 0xffff;
    return (
      a_ip >> 8 == 0x7f ||
      a_ip >> 8 == 0xa ||
      a_ip == 0xc0a8 ||
      (a_ip >= 0xac10 && a_ip <= 0xac1f)
    );
  }

  /* vượt qua ip Nhận vị trí địa lý */
  async getLocation(ip: string) {
    if (this.IsLAN(ip)) return 'IP mạng nội bộ';
    try {
      let { data } = await axios.get(
        `http://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`,
        { responseType: 'arraybuffer' },
      );
      data = JSON.parse(iconv.decode(data, 'gbk'));
      return data.pro + ' ' + data.city;
    } catch (error) {
      return 'không xác định';
    }
  }

  /**
   * @description: AES mã hóa
   * @param {string} msg
   * @param {string} secret
   * @return {*}
   */
  aesEncrypt(msg: string, secret: string): string {
    return CryptoJS.AES.encrypt(msg, secret).toString();
  }

  /**
   * @description: AES Giải mã
   * @param {string} encrypted
   * @param {string} secret
   * @return {*}
   */
  aesDecrypt(encrypted: string, secret: string): string {
    return CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);
  }

  /**
   * @description: md5 mã hóa
   * @param {string} msg
   * @return {*}
   */
  md5(msg: string): string {
    return CryptoJS.MD5(msg).toString();
  }

  /**
   * @description: Một UUID
   * @param {*}
   * @return {*}
   */
  generateUUID(): string {
    return nanoid();
  }

  /**
   * @description: Tạo số ngẫu nhiên
   * @param {number} length
   * @param {*} placeholder
   * @return {*}
   */
  generateRandomValue(
    length: number,
    placeholder = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM',
  ): string {
    const customNanoid = customAlphabet(placeholder, length);
    return customNanoid();
  }
}
